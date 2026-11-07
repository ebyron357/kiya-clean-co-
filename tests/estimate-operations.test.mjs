import test from 'node:test'
import assert from 'node:assert/strict'
import {applyEstimateCommand,estimateTotal,executeEstimateCommand} from '../lib/estimate-operations.ts'
const admin={id:'test-admin',role:'admin'},customer={id:'customer-a',role:'customer'},staff={id:'staff-a',role:'staff'}
const approval={id:'synthetic-approval',termsVersion:'test-terms',active:true}
// Synthetic cents for arithmetic tests, never activated business prices.
const offer={currency:'USD',lines:[{description:'Synthetic service',quantity:2,unitCents:100}],discountCents:10,feeCents:5,taxCents:7,expiresAt:10000,termsVersion:approval.termsVersion,pricingApprovalId:approval.id}
const submitted={id:'estimate-a',customerId:customer.id,version:0,status:'submitted'}
const reviewed=()=>applyEstimateCommand(submitted,admin,{kind:'review'},1).estimate
const quoted=()=>applyEstimateCommand(reviewed(),admin,{kind:'quote',offer},2,approval).estimate
const accepted=()=>applyEstimateCommand(quoted(),customer,{kind:'accept'},3).estimate
test('review, owner quote, acceptance and booking conversion follow audited versions',()=>{
 const a=reviewed(),b=quoted(),c=accepted(),d=applyEstimateCommand(c,admin,{kind:'convert',bookingId:'reserved-booking'},4)
 assert.equal(a.status,'under_review');assert.equal(b.totalCents,202);assert.equal(c.status,'accepted');assert.equal(d.estimate.status,'converted');assert.equal(d.estimate.version,4)
 assert.deepEqual(d.audit,{estimateId:submitted.id,actorId:admin.id,from:'accepted',to:'converted',version:4,at:4});assert.equal(submitted.version,0)
})
test('quotes require active matching owner approval and terms',()=>{
 for(const policy of [null,{...approval,active:false},{...approval,id:'different'},{...approval,termsVersion:'different'}])assert.throws(()=>applyEstimateCommand(reviewed(),admin,{kind:'quote',offer},2,policy),/approved pricing/)
})
test('customers and staff cannot prepare or convert estimates',()=>{
 for(const actor of [customer,staff]){
 assert.throws(()=>applyEstimateCommand(reviewed(),actor,{kind:'quote',offer},2,approval),/Forbidden/)
 assert.throws(()=>applyEstimateCommand(accepted(),actor,{kind:'convert',bookingId:'fake'},4),/Forbidden/)
 }
})
test('customer ownership required for acceptance and decline; admin cannot impersonate',()=>{
 for(const actor of [admin,staff,{...customer,id:'customer-b'}])for(const kind of ['accept','decline'])assert.throws(()=>applyEstimateCommand(quoted(),actor,{kind},3),/Forbidden/)
})
test('guest estimates require verified ownership linkage before acceptance',()=>assert.throws(()=>applyEstimateCommand({...quoted(),customerId:null},customer,{kind:'accept'},3),/Forbidden/))
test('expired offer cannot be accepted even if background expiry has not run',()=>{
 for(const kind of ['accept','decline'])assert.throws(()=>applyEstimateCommand(quoted(),customer,{kind},10000),/expired/)
 assert.equal(applyEstimateCommand(quoted(),admin,{kind:'expire'},10000).estimate.status,'expired')
 assert.throws(()=>applyEstimateCommand(quoted(),admin,{kind:'expire'},9999),/cannot expire/)
})
test('terminal and invalid transitions cannot bypass quote review',()=>{
 assert.throws(()=>applyEstimateCommand(submitted,customer,{kind:'accept'},1))
 assert.throws(()=>applyEstimateCommand(submitted,admin,{kind:'quote',offer},1,approval))
 assert.throws(()=>applyEstimateCommand(accepted(),admin,{kind:'quote',offer},4,approval))
 assert.throws(()=>applyEstimateCommand(quoted(),admin,{kind:'convert',bookingId:'fake'},4))
})
test('line, cent, discount and overflow validation prevents malformed estimates',()=>{
 for(const change of [{lines:[]},{currency:'EUR'},{feeCents:-1},{taxCents:0.5},{discountCents:201},{lines:[{description:'x',quantity:1000,unitCents:100000000}]},{lines:[{description:'',quantity:1,unitCents:10}]}])assert.throws(()=>estimateTotal({...offer,...change}))
 assert.equal(estimateTotal({...offer,discountCents:200,feeCents:0,taxCents:0}),0)
})
test('stored amount tampering, invalid clocks and versions fail closed',()=>{
 assert.throws(()=>applyEstimateCommand({...quoted(),totalCents:1},customer,{kind:'accept'},3),/stored offer/)
 for(const version of [-1,0.5,Number.MAX_SAFE_INTEGER])assert.throws(()=>applyEstimateCommand({...submitted,version},admin,{kind:'review'},1))
 assert.throws(()=>applyEstimateCommand(submitted,admin,{kind:'review'},NaN))
})
test('returned offers do not alias mutable command input',()=>{
 const input=structuredClone(offer);const saved=applyEstimateCommand(reviewed(),admin,{kind:'quote',offer:input},2,approval).estimate;input.lines[0].unitCents=999
 assert.equal(saved.offer.lines[0].unitCents,100)
})
// Test-only repository with serialized transaction behavior and CAS. It is NOT
// a database adapter, migration, outbox or actual booking reservation.
class TestRepository{
 row=structuredClone(submitted);requests=new Map();tail=Promise.resolve()
 transact(input){const work=this.tail.then(()=>{
  const key=input.actor.id+':'+input.idempotencyKey, previous=this.requests.get(key),payload=JSON.stringify(input)
  if(previous)return previous.payload===payload?structuredClone(previous.result):{status:'idempotency_conflict'}
  if(input.estimateId!==this.row.id)return {status:'not_found'}
  if(input.expectedVersion!==this.row.version)return {status:'conflict'}
  const {estimate}=applyEstimateCommand(this.row,input.actor,input.command,input.now,approval)
  this.row=estimate;const result={status:'saved',estimate:structuredClone(estimate)};this.requests.set(key,{payload,result});return structuredClone(result)
 });this.tail=work.then(()=>undefined,()=>undefined);return work}
}
const request={estimateId:submitted.id,expectedVersion:0,idempotencyKey:'review-key',actor:admin,command:{kind:'review'},now:1}
test('mock CAS repository permits one concurrent revision and rejects stale writes',async()=>{
 const repository=new TestRepository();const results=await Promise.all([executeEstimateCommand(request,repository),executeEstimateCommand({...request,idempotencyKey:'second-key'},repository)])
 assert.equal(results.filter(r=>r.status==='saved').length,1);assert.equal(results.filter(r=>r.status==='conflict').length,1);assert.equal(repository.row.version,1)
})
test('mock idempotency returns original receipt, rejects key reuse with changed payload',async()=>{
 const repository=new TestRepository();const a=await executeEstimateCommand(request,repository);const b=await executeEstimateCommand(request,repository);assert.deepEqual(a,b)
 assert.equal((await executeEstimateCommand({...request,now:2},repository)).status,'idempotency_conflict');assert.equal(repository.row.version,1)
})
test('command dispatcher rejects mismatched roles before contacting repository',async()=>{
 for(const input of [{...request,actor:customer},{...request,actor:staff},{...request,command:{kind:'accept'}}]){
 let called=false;await assert.rejects(()=>executeEstimateCommand(input,{transact:async()=>{called=true}}),/Forbidden/);assert.equal(called,false)
 }
})
test('command dispatcher validates identifiers and version without side effects',async()=>{
 for(const change of [{estimateId:''},{idempotencyKey:''},{expectedVersion:-1},{now:Infinity},{command:{kind:'invalid'}}]){
 let called=false;await assert.rejects(()=>executeEstimateCommand({...request,...change},{transact:async()=>{called=true}}));assert.equal(called,false)
 }
})

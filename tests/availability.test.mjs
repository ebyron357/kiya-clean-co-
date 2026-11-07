import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateAvailability } from '../lib/availability.ts'
const rules={approved:true,serviceId:'synthetic-service',resourceIds:['team-a'],servedZips:['12345'],durationMs:100,stepMs:100,bufferBeforeMs:10,bufferAfterMs:10,minimumNoticeMs:0}
const input={serviceId:rules.serviceId,zip:'12345',from:0,to:1000,now:0,windows:[{resourceId:'team-a',startsAt:0,endsAt:500}],blackouts:[],existing:[]}
test('no approval produces no invented availability',()=>{
 for(const config of [null,{...rules,approved:false}])assert.deepEqual(calculateAvailability(config,input),{status:'unconfigured',candidates:[]})
})
test('window candidates account for duration and buffers on both ends',()=>{
 const result=calculateAvailability(rules,input)
 assert.equal(result.status,'candidates');assert.deepEqual(result.candidates.map(s=>[s.startsAt,s.endsAt]),[[10,110],[110,210],[210,310],[310,410]])
 assert.ok(result.candidates.every(s=>s.startsAt-10>=0&&s.endsAt+10<=500))
})
test('notice and arbitrary query times stay aligned to approved window anchor',()=>{
 const result=calculateAvailability({...rules,minimumNoticeMs:100},{...input,now:15,from:123})
 assert.deepEqual(result.candidates.map(s=>s.startsAt),[210,310])
})
test('blackouts block travel buffers as well as the visit interval',()=>{
 const result=calculateAvailability(rules,{...input,blackouts:[{resourceId:'team-a',startsAt:115,endsAt:120}]})
 assert.deepEqual(result.candidates.map(s=>s.startsAt),[210,310])
})
test('existing reservations use both their own and candidate buffers',()=>{
 const existing=[{submissionId:'existing',customerId:'customer-a',resourceId:'team-a',startsAt:130,endsAt:200,bufferBeforeMs:10,bufferAfterMs:20}]
 assert.deepEqual(calculateAvailability(rules,{...input,existing}).candidates.map(s=>s.startsAt),[10,310])
})
test('different teams do not block each other, unknown resource windows are ignored',()=>{
 const result=calculateAvailability(rules,{...input,windows:[...input.windows,{resourceId:'unknown',startsAt:0,endsAt:500}],blackouts:[{resourceId:'unknown',startsAt:0,endsAt:500}]})
 assert.equal(result.candidates.length,4);assert.ok(result.candidates.every(s=>s.resourceId==='team-a'))
})
test('duplicate windows do not duplicate advertised candidates',()=>{
 assert.equal(calculateAvailability(rules,{...input,windows:[...input.windows,...input.windows]}).candidates.length,4)
})
test('unserved ZIP or disabled service returns no candidates',()=>{
 for(const change of [{zip:'99999'},{zip:'bad'},{serviceId:'different'}])assert.deepEqual(calculateAvailability(rules,{...input,...change}),{status:'unavailable',candidates:[]})
})
test('invalid duration, steps, identities and cent-like fractional times fail closed',()=>{
 for(const change of [{durationMs:0},{stepMs:0},{stepMs:0.1},{bufferAfterMs:-1},{resourceIds:['team-a','team-a']},{servedZips:['bad']},{minimumNoticeMs:NaN}])assert.throws(()=>calculateAvailability({...rules,...change},input))
})
test('invalid intervals, excessive query size and integer overflow are rejected',()=>{
 for(const change of [{from:1000},{to:Infinity},{to:32*24*60*60*1000},{now:Number.MAX_SAFE_INTEGER},{windows:[{resourceId:'team-a',startsAt:100,endsAt:0}]}])assert.throws(()=>calculateAvailability({...rules,minimumNoticeMs:1},{...input,...change}))
})
test('step amplification is bounded rather than looping indefinitely',()=>{
 assert.throws(()=>calculateAvailability({...rules,durationMs:1,stepMs:1,bufferBeforeMs:0,bufferAfterMs:0},{...input,to:20000,windows:[{resourceId:'team-a',startsAt:0,endsAt:20000}]}),/too broad/)
})
test('no calendar window means unavailable candidates, not sample defaults',()=>assert.deepEqual(calculateAvailability(rules,{...input,windows:[]}),{status:'candidates',candidates:[]}))
test('input objects remain unchanged and output exposes no customer records',()=>{
 const snapshot=structuredClone(input),result=calculateAvailability(rules,input)
 assert.deepEqual(input,snapshot);assert.deepEqual(Object.keys(result.candidates[0]),['resourceId','startsAt','endsAt'])
})

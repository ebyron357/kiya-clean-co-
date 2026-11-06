import test from 'node:test'
import assert from 'node:assert/strict'
import { quoteRepository } from '../lib/supabase/quote-repository.ts'
import { submitQuote } from '../lib/quote-submission.ts'
import { quoteSchema } from '../lib/quote-schema.ts'
const input=quoteSchema.parse({submissionId:'00000000-0000-4000-8000-000000000001',zip:'12345',service:'Standard Cleaning',bedrooms:2,bathrooms:1,squareFeet:1000,condition:'Regular upkeep',pets:'No pets',notes:'Synthetic test only',extras:[],frequency:'One-time',preferredDate:'2099-01-01',name:'Test Person',email:'test@example.test',phone:'',consent:true,marketing:false,website:'',user_id:'forged',totalCents:1})
// Test-only structural Supabase port; a unique Map is not PostgreSQL/RLS proof.
function database({insertError=null,lookupError=null,emptyLookup=false}={}){
 const rows=new Map(),calls=[]
 return {rows,calls,from(table){
  assert.equal(table,'kiya_quotes');return {
   async insert(row){calls.push('insert');if(insertError)return {error:insertError};if(rows.has(row.submission_id))return {error:{code:'23505'}};rows.set(row.submission_id,structuredClone(row));return {error:null}},
   select(columns){assert.equal(columns,'submission_id,user_id,customer_name,email,phone,zip,marketing_consent,details');return {eq(column,id){assert.equal(column,'submission_id');return {async maybeSingle(){calls.push('lookup');return {data:emptyLookup?null:rows.get(id)??null,error:lookupError}}}}}}
  }
 }}
}
function dependencies(db,owner=null){return {repository:quoteRepository(db),rateLimit:async()=>true,authenticatedUser:async()=>owner}}
test('actual Supabase adapter contract persists manual request and server identity only',async()=>{
 const db=database();const result=await submitQuote(input,dependencies(db,'verified-customer'))
 assert.equal(result.success,true);const row=db.rows.get(input.submissionId)
 assert.equal(row.user_id,'verified-customer');assert.equal(row.details.preferredDate,'2099-01-01');assert.deepEqual(row.details.pricing,{status:'unconfigured'})
 for(const field of ['consent','website','totalCents','user_id','email'])assert.equal(field in row.details,false)
 assert.equal('email' in result,false)
})
test('anonymous manual requests remain anonymous, not attached by matching email',async()=>{
 const db=database();await submitQuote(input,dependencies(db));assert.equal(db.rows.get(input.submissionId).user_id,null)
})
test('identical retries traverse the real adapter lookup and produce one stored row',async()=>{
 const db=database();assert.deepEqual(await submitQuote(input,dependencies(db)),await submitQuote(input,dependencies(db)))
 assert.equal(db.rows.size,1);assert.deepEqual(db.calls,['insert','insert','lookup'])
})
test('changed payload cannot silently reuse another submission',async()=>{
 const db=database();await submitQuote(input,dependencies(db))
 await assert.rejects(()=>submitQuote({...input,email:'other@example.test'},dependencies(db)),e=>e.status===409)
 assert.equal(db.rows.get(input.submissionId).email,input.email)
})
test('signed-in customer cannot reuse an anonymous or different-owner submission',async()=>{
 const db=database();await submitQuote(input,dependencies(db,'customer-a'))
 await assert.rejects(()=>submitQuote(input,dependencies(db,'customer-b')),e=>e.status===409)
})
test('rate-limit denial never authenticates or writes',async()=>{
 const db=database();let called=false;await assert.rejects(()=>submitQuote(input,{...dependencies(db),rateLimit:async()=>false,authenticatedUser:async()=>{called=true;return null}}),e=>e.status===429)
 assert.equal(called,false);assert.equal(db.calls.length,0)
})
test('auth and limiter outages fail closed before storage',async()=>{
 for(const change of [{rateLimit:async()=>{throw Error('offline')}},{authenticatedUser:async()=>{throw Error('offline')}}]){
 const db=database();await assert.rejects(()=>submitQuote(input,{...dependencies(db),...change}));assert.equal(db.calls.length,0)
 }
})
test('unrelated unique conflicts cannot become successful receipts',async()=>{
 const db=database({insertError:{code:'23505'},emptyLookup:true});await assert.rejects(()=>submitQuote(input,dependencies(db)),/lookup unavailable/)
})
test('storage errors and failed retry lookups never expose raw database messages',async()=>{
 for(const options of [{insertError:{code:'42501',message:'PRIVATE DATABASE DETAIL'}},{insertError:{code:'23505'},lookupError:{code:'42501',message:'PRIVATE DATABASE DETAIL'}}]){
 await assert.rejects(()=>submitQuote(input,dependencies(database(options))),e=>!e.message.includes('PRIVATE'))
 }
})
test('unknown repository results do not claim successful storage',async()=>{
 await assert.rejects(()=>submitQuote(input,{rateLimit:async()=>true,authenticatedUser:async()=>null,repository:{save:async()=> 'unexpected'}}),/Invalid quote persistence result/)
})

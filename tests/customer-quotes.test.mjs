import test from 'node:test'
import assert from 'node:assert/strict'
import { customerQuote, customerQuoteColumns } from '../lib/customer-quotes.ts'
const user='00000000-0000-4000-8000-000000000001',id='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003'
const row={id,user_id:user,status:'requested',zip:'12345',created_at:'2030-01-01',email:'PRIVATE',internal_notes:'PRIVATE',details:{service:'Test service',bedrooms:2,bathrooms:1,squareFeet:1000,frequency:'One-time',preferredDate:'2099-01-01',condition:'Regular upkeep',pets:'No pets',notes:'Synthetic request',extras:['Test add-on'],pricing:{private:'PRIVATE'},internal:'PRIVATE'}}
function database(data=row,error=null){
 const calls=[]
 return {
  calls,
  from(table){
   calls.push(['table',table])
   return { select(columns){
    calls.push(['select',columns])
    return { eq(column,value){
     calls.push([column,value])
     return { eq(owner,key){
      calls.push([owner,key])
      return { async maybeSingle(){return {data,error}} }
     } }
    } }
   } }
  }
 }
}
test('customer adapter filters record ID and verified session owner before reading',async()=>{
 const db=database(),result=await customerQuote(db,user,id)
 assert.equal(result.service,'Test service');assert.equal(result.preferredDate,'2099-01-01')
 assert.deepEqual(db.calls,[['table','kiya_quotes'],['select',customerQuoteColumns],['id',id],['user_id',user]])
})
test('no session or malformed identity cannot call the database',async()=>{
 for(const [actor,record] of [[null,id],['bad',id],[user,'bad']]){const db=database();await assert.rejects(()=>customerQuote(db,actor,record));assert.equal(db.calls.length,0)}
})
test('different customer data is never returned even if an adapter violates its filter',async()=>{
 assert.equal(await customerQuote(database({...row,user_id:other}),user,id),null)
 assert.equal(await customerQuote(database({...row,id:other}),user,id),null)
})
test('missing and another-owner records share a not-found result',async()=>{
 assert.equal(await customerQuote(database(null),user,id),null);assert.equal(await customerQuote(database({...row,user_id:other}),user,id),null)
})
test('projection excludes email, ownership IDs, pricing internals and arbitrary metadata',async()=>{
 const result=await customerQuote(database(),user,id)
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE/);assert.equal('user_id' in result,false);assert.equal('email' in result,false)
})
test('storage errors never return customer rows or provider errors',async()=>{
 await assert.rejects(()=>customerQuote(database(row,{message:'PRIVATE DATABASE ERROR'}),user,id),e=>e.message==='Request unavailable')
})
test('malformed JSON details render safe empty values without reflecting unknown fields',async()=>{
 const result=await customerQuote(database({...row,details:{bedrooms:NaN,bathrooms:-1,extras:['Valid',{private:'SECRET'}],notes:{private:'SECRET'}}}),user,id)
 assert.equal(result.bedrooms,'');assert.equal(result.bathrooms,'');assert.equal(result.notes,'');assert.deepEqual(result.extras,['Valid'])
})

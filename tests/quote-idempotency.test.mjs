import test from 'node:test'
import assert from 'node:assert/strict'
import { sameQuoteSubmission } from '../lib/quote-idempotency.ts'
const row={submission_id:'synthetic-id',user_id:null,customer_name:'Synthetic',email:'test@example.test',phone:'',zip:'12345',marketing_consent:false,details:{service:'Test service',bedrooms:2,extras:['Test extra'],notes:'',preferredDate:'',pricing:{status:'unconfigured'}}}
test('exact retry matches without returning any existing customer information',()=>assert.equal(sameQuoteSubmission(structuredClone(row),row),true))
test('retry cannot change contact, consent or owner',()=>{
 for(const change of [{email:'other@example.test'},{customer_name:'other'},{user_id:'other'},{phone:'1234'},{zip:'54321'},{marketing_consent:true}])assert.equal(sameQuoteSubmission(row,{...row,...change}),false)
})
test('retry cannot change service, date, quantities or instructions',()=>{
 for(const change of [{service:'other'},{bedrooms:3},{preferredDate:'2099-01-01'},{notes:'changed'},{extras:[]}])assert.equal(sameQuoteSubmission(row,{...row,details:{...row.details,...change}}),false)
})
test('server-owned pricing metadata does not turn an otherwise identical retry into a new request',()=>{
 assert.equal(sameQuoteSubmission({...row,details:{...row.details,pricing:{status:'new_server_result'}}},row),true)
})
test('JSON object key order does not matter',()=>{
 const a={...row,details:{...row.details,nested:{a:1,b:2}}};const b={...row,details:{...row.details,nested:{b:2,a:1}}};assert.equal(sameQuoteSubmission(a,b),true)
})
test('old client without optional preferred date matches blank only',()=>{
 const {preferredDate,...details}=row.details
 assert.equal(sameQuoteSubmission({...row,details},row),true)
 assert.equal(sameQuoteSubmission({...row,details:{...row.details,preferredDate:'2099-01-01'}},{...row,details}),false)
})
test('invalid or absent stored details cannot be accepted as an idempotent retry',()=>{
 for(const details of [null,undefined,'bad',{}])assert.equal(sameQuoteSubmission({...row,details},row),false)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { authCallbackDestination, requestAccountRecovery, completeAccountRecovery, recoveryReceipt } from '../lib/account-recovery.ts'
const email = {email:'controlled@example.test'}
const password = {password:'test-only-long-passphrase',confirmation:'test-only-long-passphrase'}
test('recovery is off by default and never invokes provider',async()=>{
 let called=false;const result=await requestAccountRecovery(email,'https://preview.example',{enabled:false,send:async()=>{called=true}})
 assert.equal(called,false);assert.match(result.message,/not enabled/)
})
test('invalid email never invokes provider',async()=>{
 let called=false;await requestAccountRecovery({email:'bad'},'https://preview.example',{enabled:true,send:async()=>{called=true}});assert.equal(called,false)
})
test('PKCE recovery uses only the fixed same-origin callback and destination',async()=>{
 let actual;const result=await requestAccountRecovery(email,'https://preview.example',{enabled:true,send:async(...args)=>{actual=args}})
 assert.equal(result.message,recoveryReceipt);assert.equal(actual[0],email.email)
 const url=new URL(actual[1]);assert.equal(url.origin,'https://preview.example');assert.equal(url.pathname,'/auth/callback');assert.equal(url.searchParams.get('next'),'/auth/reset-password')
})
test('unknown email and provider failures receive identical non-enumerating receipt',async()=>{
 for(const send of [async()=>({error:{message:'unknown email'}}),async()=>{throw Error('sensitive provider failure')},async()=>({data:{}})]){
  assert.deepEqual(await requestAccountRecovery(email,'https://preview.example',{enabled:true,send}),{message:recoveryReceipt})
 }
})
test('invalid or credential-bearing recovery origins cannot send mail',async()=>{
 for(const origin of ['bad','http://external.example','https://user:password@preview.example','https://preview.example/other','https://preview.example?next=x','https://preview.example#x']){
  let called=false;await requestAccountRecovery(email,origin,{enabled:true,send:async()=>{called=true}});assert.equal(called,false,origin)
 }
})
test('localhost development is supported without arbitrary HTTP hosts',async()=>{
 let called=false;await requestAccountRecovery(email,'http://localhost:3000',{enabled:true,send:async()=>{called=true}});assert.equal(called,true)
})
test('callback only permits account or reset-password, never an external redirect',()=>{
 assert.equal(authCallbackDestination('/auth/reset-password'),'/auth/reset-password')
 for(const next of [null,'https://attacker.example','//attacker.example','/\\attacker.example','/auth/reset-password?next=x','/admin','%2f%2fattacker.example'])assert.equal(authCallbackDestination(next),'/account')
})
test('password update off flag performs no auth or mutation',async()=>{
 let called=false;const result=await completeAccountRecovery(password,{enabled:false,authenticated:async()=>{called=true;return true},update:async()=>{called=true;return true}})
 assert.equal(called,false);assert.equal(result.success,false)
})
test('invalid/mismatched/short passwords are rejected before auth',async()=>{
 for(const input of [{...password,confirmation:'different'},{password:'short',confirmation:'short'},{...password,password:'x'.repeat(129)}]){
 let called=false;const result=await completeAccountRecovery(input,{enabled:true,authenticated:async()=>{called=true;return true},update:async()=>true});assert.equal(result.success,false);assert.equal(called,false)
 }
})
test('no session can update a password',async()=>{
 let updated=false;const result=await completeAccountRecovery(password,{enabled:true,authenticated:async()=>false,update:async()=>{updated=true;return true}})
 assert.equal(updated,false);assert.equal(result.success,false)
})
test('verified session update succeeds using only supplied password',async()=>{
 let value;const result=await completeAccountRecovery(password,{enabled:true,authenticated:async()=>true,update:async p=>{value=p;return true}})
 assert.equal(result.success,true);assert.equal(value,password.password);assert.ok(!JSON.stringify(result).includes(password.password))
})
test('update and session provider errors never leak',async()=>{
 for(const deps of [{authenticated:async()=>{throw Error('secret')},update:async()=>true},{authenticated:async()=>true,update:async()=>false},{authenticated:async()=>true,update:async()=>{throw Error('secret')}}]){
 const result=await completeAccountRecovery(password,{enabled:true,...deps});assert.equal(result.success,false);assert.doesNotMatch(JSON.stringify(result),/secret/)
 }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { transitionBooking, staffJob, customerChangeRequest, reservationsConflict, requestReservation } from '../lib/booking-operations.ts'
const admin={id:'owner',role:'admin'},staff={id:'assigned-staff',role:'staff'},customer={id:'customer-a',role:'customer'}
const job={id:'job-a',customerId:customer.id,assignedStaffIds:[staff.id],status:'assigned',service:'Test service',startsAt:100000,endsAt:200000,instructions:'Synthetic priority',checklist:[{id:'task',label:'Test task',completed:true}]}
const reservation={submissionId:'retry-a',customerId:customer.id,resourceId:'team-a',startsAt:100000,endsAt:200000,bufferBeforeMs:10000,bufferAfterMs:10000}
test('admin lifecycle transitions return an audit event without changing source record',()=>{
 const source={...job,status:'requested'};const result=transitionBooking(source,admin,'pending_confirmation',1)
 assert.equal(result.booking.status,'pending_confirmation');assert.equal(source.status,'requested');assert.deepEqual(result.audit,{bookingId:job.id,actorId:admin.id,from:'requested',to:'pending_confirmation',at:1})
})
test('assigned staff can start and complete their own job',()=>{
 const started=transitionBooking(job,staff,'in_progress',1);const done=transitionBooking(started.booking,staff,'completed',2);assert.equal(done.booking.status,'completed')
})
test('unassigned staff, customers and forged user role have no status authority',()=>{
 for(const actor of [{...staff,id:'other-staff'},customer,{id:'other',role:'untrusted'}])assert.throws(()=>transitionBooking(job,actor,'in_progress',1),/Forbidden/)
})
test('staff cannot assign or cancel jobs, even their own',()=>{
 for(const next of ['canceled','assigned','confirmed'])assert.throws(()=>transitionBooking(job,staff,next,1),/Forbidden/)
})
test('incomplete checklist blocks completion for admin and staff',()=>{
 const unfinished={...job,status:'in_progress',checklist:[{id:'task',label:'test',completed:false}]}
 for(const actor of [staff,admin])assert.throws(()=>transitionBooking(unfinished,actor,'completed',1),/Checklist incomplete/)
})
test('terminal states cannot silently reopen or skip the lifecycle',()=>{
 for(const status of ['completed','canceled','rescheduled','disputed'])assert.throws(()=>transitionBooking({...job,status},admin,'confirmed',1),/Invalid booking transition/)
 assert.throws(()=>transitionBooking({...job,status:'requested'},admin,'completed',1),/Invalid booking transition/)
})
test('staff job projection excludes billing, unrelated identities and arbitrary nested fields',()=>{
 const output=staffJob({...job,invoice:{amount:100},customerId:'private',secret:'private',checklist:[{...job.checklist[0],billing:'private'}]},staff)
 assert.deepEqual(Object.keys(output),['id','service','status','startsAt','endsAt','instructions','checklist']);assert.doesNotMatch(JSON.stringify(output),/private/)
 assert.throws(()=>staffJob(job,{...staff,id:'other'}),/Forbidden/)
})
test('customer changes are requests only, not silent confirmed cancellations',()=>{
 const request=customerChangeRequest(job,customer,{kind:'cancel',reason:' Schedule changed '},1)
 assert.equal(request.status,'pending_review');assert.equal(request.reason,'Schedule changed');assert.equal(job.status,'assigned')
 assert.equal(customerChangeRequest(job,customer,{kind:'reschedule',reason:'Test'},1).kind,'reschedule')
})
test('customer cannot request changes on another customer or completed booking',()=>{
 assert.throws(()=>customerChangeRequest(job,{...customer,id:'customer-b'},{kind:'cancel',reason:'Test'},1),/Forbidden/)
 assert.throws(()=>customerChangeRequest({...job,status:'completed'},customer,{kind:'cancel',reason:'Test'},1),/unavailable/)
})
test('invalid change input and audit clocks fail closed',()=>{
 for(const reason of ['', ' ', 'x'.repeat(1001)])assert.throws(()=>customerChangeRequest(job,customer,{kind:'cancel',reason},1))
 assert.throws(()=>transitionBooking(job,admin,'in_progress',NaN))
})
test('overlapping resource bookings conflict with configured before/after buffers',()=>{
 assert.equal(reservationsConflict(reservation,{...reservation,startsAt:210000,endsAt:300000}),true)
 assert.equal(reservationsConflict(reservation,{...reservation,startsAt:220000,endsAt:300000}),false)
 assert.equal(reservationsConflict(reservation,{...reservation,resourceId:'different-team'}),false)
})
test('touching unbuffered appointments do not overlap',()=>{
 const a={...reservation,bufferBeforeMs:0,bufferAfterMs:0};assert.equal(reservationsConflict(a,{...a,startsAt:a.endsAt,endsAt:300000}),false)
})
test('invalid intervals and overflow fail before store invocation',async()=>{
 for(const patch of [{startsAt:NaN},{endsAt:100000},{bufferBeforeMs:-1},{bufferBeforeMs:100001},{endsAt:Number.MAX_SAFE_INTEGER,bufferAfterMs:10},{resourceId:''}]){
 let called=false;await assert.rejects(()=>requestReservation({...reservation,...patch},customer,{reserveAtomically:async()=>{called=true}}));assert.equal(called,false)
 }
})
test('reservation requires authenticated matching customer, not caller-supplied alternate ownership',async()=>{
 let called=false;await assert.rejects(()=>requestReservation(reservation,{...customer,id:'b'},{reserveAtomically:async()=>{called=true}}),/Forbidden/);assert.equal(called,false)
})
// Test-only serialized reference adapter. NEVER imported by the application.
// This proves command/adapter contract semantics, NOT live SQL atomicity/RLS.
class InMemoryAtomicStore {
 rows=[];tail=Promise.resolve()
 reserveAtomically(input){
  const work=this.tail.then(async()=>{
   await Promise.resolve()
   const existing=this.rows.find(r=>r.input.submissionId===input.submissionId)
   if(existing)return JSON.stringify(existing.input)===JSON.stringify(input)?{status:'reserved',bookingId:existing.id}:{status:'idempotency_conflict'}
   if(this.rows.some(r=>reservationsConflict(r.input,input)))return {status:'conflict'}
   const id=`fixture-${this.rows.length+1}`;this.rows.push({id,input:structuredClone(input)});return {status:'reserved',bookingId:id}
  });this.tail=work.then(()=>undefined);return work
 }
}
test('mock adapter contract: concurrent conflicting submissions reserve once',async()=>{
 const store=new InMemoryAtomicStore();const results=await Promise.all(Array.from({length:20},(_,i)=>requestReservation({...reservation,submissionId:`run-${i}`},customer,store)))
 assert.equal(results.filter(r=>r.status==='reserved').length,1);assert.equal(store.rows.length,1)
})
test('mock adapter contract: retries are idempotent and changed payload is refused',async()=>{
 const store=new InMemoryAtomicStore();const [a,b]=await Promise.all([requestReservation(reservation,customer,store),requestReservation(reservation,customer,store)])
 assert.deepEqual(a,b);assert.equal(store.rows.length,1)
 assert.equal((await requestReservation({...reservation,endsAt:300000},customer,store)).status,'idempotency_conflict')
})

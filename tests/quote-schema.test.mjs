import test from 'node:test'
import assert from 'node:assert/strict'
import { quoteSchema, validPreferredDate } from '../lib/quote-schema.ts'
const valid={submissionId:'00000000-0000-4000-8000-000000000001',zip:'28202',service:'Standard Cleaning',bedrooms:2,bathrooms:1,squareFeet:1000,condition:'Regular upkeep',pets:'No pets',notes:'',extras:[],frequency:'One-time',name:'Test Person',email:'test@example.com',phone:'',consent:true,marketing:false,website:''}
test('valid request is accepted',()=>assert.equal(quoteSchema.safeParse(valid).success,true))
test('invalid zip is rejected',()=>assert.equal(quoteSchema.safeParse({...valid,zip:'abc'}).success,false))
test('missing consent is rejected',()=>assert.equal(quoteSchema.safeParse({...valid,consent:false}).success,false))
test('honeypot is rejected',()=>assert.equal(quoteSchema.safeParse({...valid,website:'spam'}).success,false))
test('oversized notes are rejected',()=>assert.equal(quoteSchema.safeParse({...valid,notes:'a'.repeat(2001)}).success,false))
test('unknown extras are rejected',()=>assert.equal(quoteSchema.safeParse({...valid,extras:['unknown']}).success,false))
test('browser totals cannot override authoritative pricing',()=>assert.equal('total' in quoteSchema.parse({...valid,total:1}),false))

const clock = new Date('2030-02-28T12:00:00Z')
test('date preference supports flexible requests and actual future calendar dates',()=>{
 for(const value of ['', '2030-02-28','2030-03-01','2032-02-29'])assert.equal(validPreferredDate(value,clock),true)
})
test('date preference rejects past, malformed and normalized impossible dates',()=>{
 for(const value of ['2030-02-27','2030-02-29','2030-02-30','2030-13-01','2030-2-28','2030-03-01T12:00:00Z','not a date'])assert.equal(validPreferredDate(value,clock),false,value)
})
test('existing quote clients need not supply a preferred date',()=>assert.equal(quoteSchema.safeParse(valid).success,true))
test('preferred date is preserved in validated details without becoming an appointment',()=>{
 const parsed=quoteSchema.parse({...valid,preferredDate:'2099-03-01',status:'confirmed',bookingId:'fake'})
 assert.equal(parsed.preferredDate,'2099-03-01');assert.equal('status' in parsed,false);assert.equal('bookingId' in parsed,false)
})

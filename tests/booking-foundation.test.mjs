import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingSchema } from '../lib/booking-schema.ts'
import { isServedZip,bookingPrice } from '../lib/booking-prices.ts'
const booking={submissionId:crypto.randomUUID(),slotId:crypto.randomUUID(),zip:'28026',service:'Standard Cleaning',bedrooms:3,fullBaths:2,halfBaths:1,frequency:'Every two weeks',quantities:[0,0,0,0,0,0],circle:false,name:'Test Customer',email:'qa@example.com',phone:'7045550123',street:'123 Test Street',city:'Concord',accessNotes:'',pets:'',smsConsent:false,terms:true,website:''}
test('all configured ZIPs including 28026 and Charlotte prefix are served',()=>{for(const zip of ['28107','28097','28025','28026','28027','28227','28200','28299'])assert.equal(isServedZip(zip),true)})
test('out of area and malformed ZIPs are rejected',()=>{for(const zip of ['90210','28101','282','282001','282ab',' 28201'])assert.equal(isServedZip(zip),false)})
test('valid pending booking input accepted',()=>assert.equal(bookingSchema.safeParse(booking).success,true))
test('terms required but SMS consent optional',()=>{assert.equal(bookingSchema.safeParse({...booking,terms:false}).success,false);assert.equal(bookingSchema.safeParse({...booking,smsConsent:false}).success,true)})
test('Circle requires biweekly frequency',()=>assert.equal(bookingSchema.safeParse({...booking,circle:true,frequency:'Monthly'}).success,false))
test('separate bathrooms produce expected extra-half-bath price',()=>assert.equal(bookingPrice({...booking,bathrooms:booking.fullBaths+booking.halfBaths/2}).totalCents,15900))
test('unknown slots and fractional baths rejected',()=>{for(const change of [{slotId:''},{halfBaths:.5},{fullBaths:1.5},{bedrooms:5},{website:'bot'}])assert.equal(bookingSchema.safeParse({...booking,...change}).success,false)})
test('browser cannot override stored status, identity or price',()=>{const parsed=bookingSchema.parse({...booking,status:'confirmed',user_id:crypto.randomUUID(),price_cents:1});assert.equal('status' in parsed,false);assert.equal('user_id' in parsed,false);assert.equal('price_cents' in parsed,false)})

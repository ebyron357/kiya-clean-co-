import test from 'node:test'
import assert from 'node:assert/strict'
import { quoteSchema } from '../lib/quote-schema.ts'
const valid={submissionId:'00000000-0000-4000-8000-000000000001',zip:'28202',service:'Standard Cleaning',bedrooms:2,bathrooms:1,squareFeet:1000,condition:'Regular upkeep',pets:'No pets',notes:'',extras:[],frequency:'One-time',name:'Test Person',email:'test@example.com',phone:'7045550123',consent:true,marketing:false,website:'',address:'123 Test Street, Charlotte NC',preferredDate:'2099-01-01',preferredTime:'Flexible',circle:false,quantities:[0,0,0,0,0,0]}
test('valid request is accepted',()=>assert.equal(quoteSchema.safeParse(valid).success,true))
test('invalid zip is rejected',()=>assert.equal(quoteSchema.safeParse({...valid,zip:'abc'}).success,false))
test('missing consent is rejected',()=>assert.equal(quoteSchema.safeParse({...valid,consent:false}).success,false))
test('honeypot is rejected',()=>assert.equal(quoteSchema.safeParse({...valid,website:'spam'}).success,false))
test('oversized notes are rejected',()=>assert.equal(quoteSchema.safeParse({...valid,notes:'a'.repeat(2001)}).success,false))
test('unknown extras are rejected',()=>assert.equal(quoteSchema.safeParse({...valid,extras:['unknown']}).success,false))
test('browser totals cannot override authoritative pricing',()=>assert.equal('total' in quoteSchema.parse({...valid,total:1}),false))

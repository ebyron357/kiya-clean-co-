import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quoteSchema } from '../lib/quote-schema'
const valid = { submissionId: '123e4567-e89b-42d3-a456-426614174000', name: 'Test Customer', email: 'TEST@example.com', phone: '', zip: '28202', service: 'standard', frequency: 'once', bedrooms: '2', notes: '', consent: true, website: '' }
test('valid quote normalizes email', () => { assert.equal(quoteSchema.parse(valid).email, 'test@example.com') })
test('requires contact consent', () => { assert.equal(quoteSchema.safeParse({...valid, consent: false}).success, false) })
test('rejects invalid service and ZIP', () => { for (const data of [{...valid, service:'anything'}, {...valid, zip:'123'}]) assert.equal(quoteSchema.safeParse(data).success, false) })
test('rejects honeypot and oversized notes', () => { for (const data of [{...valid, website:'spam'}, {...valid, notes:'a'.repeat(2001)}]) assert.equal(quoteSchema.safeParse(data).success, false) })
test('rejects invalid email and phone', () => { for (const data of [{...valid, email:'not-email'}, {...valid, phone:'nonsense'}]) assert.equal(quoteSchema.safeParse(data).success, false) })
test('does not accept client status or user id', () => { const data = quoteSchema.parse({...valid, status:'draft', user_id:'untrusted'}); assert.ok(!('status' in data)); assert.ok(!('user_id' in data)) })

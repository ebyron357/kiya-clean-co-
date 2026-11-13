import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quoteSchema } from '../lib/quote-schema'
import { getQuoteService, quoteServiceHref, sectionHref, quoteHomeSchema, quoteDetailsSchema, quoteStepForField } from '../lib/quote-flow'
const valid = { submissionId: '123e4567-e89b-42d3-a456-426614174000', name: 'Test Customer', email: 'TEST@example.com', phone: '', zip: '28202', service: 'standard', frequency: 'once', bedrooms: '2', notes: '', consent: true, website: '' }
test('service query accepts known services and safely defaults', () => {
  assert.equal(getQuoteService('deep'), 'deep')
  assert.equal(getQuoteService('move'), 'move')
  for (const value of ['standard', 'invalid', null, undefined, ['deep']]) assert.equal(getQuoteService(value), 'standard')
})
test('radio selection preserves other query parameters and section', () => {
  assert.equal(quoteServiceHref('https://kiya.example/?utm_source=email&service=standard#quote', 'deep'), '/?utm_source=email&service=deep#quote')
})
test('service links select the requested service without dropping other parameters', () => {
  assert.equal(sectionHref('https://kiya.example/?utm_source=email&service=standard#services', '?service=move#quote'), '/?utm_source=email&service=move#quote')
})
test('section links preserve the selected service', () => {
  assert.equal(sectionHref('https://kiya.example/?service=deep#quote', '/#faq'), '/?service=deep#faq')
  assert.equal(sectionHref('https://kiya.example/?service=deep#faq', '#quote'), '/?service=deep#quote')
})
test('other pages and external links retain native navigation', () => {
  for (const href of ['/privacy', '/', 'https://other.example/#quote']) assert.equal(sectionHref('https://kiya.example/?service=deep', href), null)
  assert.equal(sectionHref('https://kiya.example/privacy', '/#quote'), null)
})
test('home step validates independently of contact details', () => {
  assert.equal(quoteHomeSchema.safeParse({ service: 'deep', zip: '28202', bedrooms: 'studio', frequency: 'once' }).success, true)
  assert.equal(quoteHomeSchema.safeParse({ ...valid, zip: '12' }).success, false)
})
test('review requires complete details but not consent yet', () => {
  const { submissionId, consent, website, ...details } = valid
  assert.equal(quoteDetailsSchema.parse(details).email, 'test@example.com')
  assert.equal(quoteDetailsSchema.safeParse({ ...details, name: '  ' }).success, false)
  assert.equal(quoteDetailsSchema.safeParse({ ...details, email: 'invalid' }).success, false)
  assert.equal(quoteDetailsSchema.safeParse({ ...details, phone: 'invalid' }).success, false)
  assert.equal(quoteSchema.safeParse(details).success, false)
})
test('validation errors return to the correct step', () => {
  for (const field of ['service', 'zip', 'bedrooms', 'frequency']) assert.equal(quoteStepForField(field), 0)
  for (const field of ['name', 'email', 'phone', 'notes']) assert.equal(quoteStepForField(field), 1)
  assert.equal(quoteStepForField('consent'), 2)
})
test('valid quote normalizes email', () => { assert.equal(quoteSchema.parse(valid).email, 'test@example.com') })
test('requires contact consent', () => { assert.equal(quoteSchema.safeParse({...valid, consent: false}).success, false) })
test('rejects invalid service and ZIP', () => { for (const data of [{...valid, service:'anything'}, {...valid, zip:'123'}]) assert.equal(quoteSchema.safeParse(data).success, false) })
test('rejects honeypot and oversized notes', () => { for (const data of [{...valid, website:'spam'}, {...valid, notes:'a'.repeat(2001)}]) assert.equal(quoteSchema.safeParse(data).success, false) })
test('rejects invalid email and phone', () => { for (const data of [{...valid, email:'not-email'}, {...valid, phone:'nonsense'}]) assert.equal(quoteSchema.safeParse(data).success, false) })
test('does not accept client status or user id', () => { const data = quoteSchema.parse({...valid, status:'draft', user_id:'untrusted'}); assert.ok(!('status' in data)); assert.ok(!('user_id' in data)) })

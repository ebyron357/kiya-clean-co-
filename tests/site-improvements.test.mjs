import test from 'node:test'
import assert from 'node:assert/strict'
import { analyticsUrl, quoteMetric } from '../lib/analytics-policy.ts'
import { parseBusinessProfile } from '../lib/business-profile.ts'
import { isOwner } from '../lib/owner-access.ts'
import { sendQuoteNotifications } from '../lib/quote-notifications.ts'

const id = '00000000-0000-4000-8000-000000000001'
const config = { mode: 'sandbox', apiKey: 'synthetic-placeholder', from: 'sender@example.test', testRecipient: 'sandbox@example.test' }
test('analytics strips every query and fragment, including submitted personal data', () => {
  assert.equal(analyticsUrl('https://example.test/quote?email=private%40example.test&zip=12345#secret'), 'https://example.test/quote')
  assert.equal(analyticsUrl('https://example.test/services/deep-cleaning?token=secret'), 'https://example.test/services/deep-cleaning')
})
test('analytics drops private, payment, unknown and user-controlled paths', () => {
  for (const path of ['/admin', '/account', `/account/quotes/${id}`, '/auth/callback', '/payment/return', '/services/person@example.test', '/quote/secret']) assert.equal(analyticsUrl(`https://example.test${path}`), null)
  assert.equal(analyticsUrl('malformed'), null)
})
test('quote metrics contain static event name and step number only', () => {
  assert.deepEqual(quoteMetric('submitted', 5), { name: 'quote_submitted', properties: { step: 6 } })
  for (const step of [-1, 6, 0.5, NaN, Infinity]) assert.equal(quoteMetric('started', step), null)
})
test('business profile requires explicit approval and validates all fields', () => {
  for (const raw of [undefined, '', '{', '{}', JSON.stringify({ approved: false }), JSON.stringify({ approved: true, email: 'not-email' }), JSON.stringify({ approved: true, serviceZips: ['abc'] }), JSON.stringify({ approved: true, phone: 'javascript:alert(1)' }), JSON.stringify({ approved: true, unapprovedClaim: 'insured' })]) assert.equal(parseBusinessProfile(raw), null)
  assert.deepEqual(parseBusinessProfile(JSON.stringify({ approved: true, email: 'owner@example.test', privacyEmail: 'privacy@example.test', serviceZips: ['12345'] })), { approved: true, email: 'owner@example.test', privacyEmail: 'privacy@example.test', serviceZips: ['12345'] })
})
test('owner authorization trusts only server app metadata, never customer-editable metadata', () => {
  for (const user of [null, {}, { user_metadata: { role: 'admin' } }, { app_metadata: { role: 'customer' } }]) assert.equal(isOwner(user), false)
  assert.equal(isOwner({ app_metadata: { role: 'admin' } }), true)
})
test('notifications are disabled without full sandbox configuration, including live mode', async () => {
  for (const candidate of [undefined, {}, { ...config, mode: 'live' }, { ...config, apiKey: '' }, { ...config, testRecipient: 'not-email' }]) assert.equal(await sendQuoteNotifications(id, candidate, () => { throw Error('Must not send') }), 'disabled')
  assert.equal(await sendQuoteNotifications('bad-id', config), 'disabled')
})
test('sandbox notification payloads contain no customer details and use per-audience idempotency keys', async () => {
  const calls = []
  const result = await sendQuoteNotifications(id, config, async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) })
    return Response.json({ id: 'synthetic-provider-id' })
  })
  assert.equal(result, 'accepted'); assert.equal(calls.length, 2)
  assert.notEqual(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key'])
  for (const call of calls) {
    assert.equal(call.url, 'https://api.resend.com/emails')
    assert.deepEqual(call.body.to, ['sandbox@example.test'])
    assert.equal(call.body.from, 'sender@example.test')
    assert.match(call.headers['Idempotency-Key'], new RegExp(id))
    assert.match(call.body.subject, /SANDBOX/)
    assert.equal(call.redirect, 'error')
    assert.doesNotMatch(JSON.stringify(call.body), /customer_name|phone|notes|bedrooms/)
  }
})
test('notification errors, malformed acknowledgements and network failures never claim delivery', async () => {
  for (const send of [async () => new Response('private provider error', { status: 500 }), async () => Response.json({}), async () => { throw Error('private network error') }]) assert.equal(await sendQuoteNotifications(id, config, send), 'failed')
})

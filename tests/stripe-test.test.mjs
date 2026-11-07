import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  stripeTestConfig, stripeTestGateway, verifyStripeTestWebhook,
  parseVerifiedStripeEvent,
} from '../lib/payments/stripe-test.ts'
import { calculatePaymentPlan } from '../lib/payments/payment-plan.ts'

const nowMs = 1_800_000_000_000
const offer = {
  bookingId: 'booking-test-1', customerId: 'customer-test-1',
  serviceLabel: 'Deep Cleaning', currency: 'usd', totalCents: 19900,
  depositCents: 5000, pricingApprovalId: 'a1', termsVersion: 'v1',
  approved: true, status: 'held', offerExpiresAtMs: nowMs + 3_600_000,
  reservationExpiresAtMs: nowMs + 3_600_000,
}
const env = () => ({
  KIYA_STRIPE_TEST_ENABLED: 'true',
  STRIPE_SECRET_KEY: 'sk_test_synthetic_unit_tests_only',
  STRIPE_WEBHOOK_SECRET: 'whsec_synthetic_unit_tests_only',
  KIYA_CHECKOUT_ORIGIN: 'https://kiya.example.test',
})
const signed = (data, t = Math.floor(nowMs / 1000)) => {
  const body = JSON.stringify(data)
  const hash = createHmac('sha256', env().STRIPE_WEBHOOK_SECRET).update(String(t) + '.' + body).digest('hex')
  return { body, header: 't=' + t + ',v1=' + hash }
}
const evt = (change = {}) => ({
  id: 'evt_test_123', type: 'checkout.session.completed', livemode: false,
  data: { object: { object: 'checkout.session', id: 'cs_test_123',
    livemode: false, currency: 'usd', amount_total: 5000, payment_status: 'paid',
    client_reference_id: 'booking-test-1',
    metadata: { booking_id: 'booking-test-1', claim_id: 'claim_test_1',
      stage: 'initial', choice: 'deposit' } } }, ...change,
})

test('refuses live keys, missing opt-in, and untrusted redirect origins', () => {
  assert.throws(() => stripeTestConfig({ ...env(), KIYA_STRIPE_TEST_ENABLED: 'false' }))
  assert.throws(() => stripeTestConfig({ ...env(), STRIPE_SECRET_KEY: 'sk_live_dont_use_me_here' }))
  for (const origin of ['http://kiya.example.test', 'https://evil.example/path', 'https://user:pw@example.com/']) {
    assert.throws(() => stripeTestConfig({ ...env(), KIYA_CHECKOUT_ORIGIN: origin }))
  }
})

test('creates card-only test Checkout with server-calculated deposit and metadata', async () => {
  const config = stripeTestConfig(env())
  const plan = calculatePaymentPlan(offer, 'deposit', 'initial', nowMs)
  let observed
  const gateway = stripeTestGateway(config, async (url, init) => {
    observed = { url, init, body: new URLSearchParams(init.body) }
    return new Response(JSON.stringify({
      id: 'cs_test_abc123', url: 'https://checkout.stripe.com/c/pay/abc123',
      status: 'open', payment_status: 'unpaid', currency: 'usd',
      amount_total: 5000, expires_at: plan.checkoutExpiresAtSeconds, livemode: false,
    }), { status: 200 })
  })
  const result = await gateway.createCheckout({ claimId: 'claim_test_1', plan, customerEmail: 'verified@example.test' })
  assert.equal(result.sessionId, 'cs_test_abc123')
  assert.equal(observed.url, 'https://api.stripe.com/v1/checkout/sessions')
  assert.equal(observed.body.get('line_items[0][price_data][unit_amount]'), '5000')
  assert.equal(observed.body.get('metadata[choice]'), 'deposit')
  assert.equal(observed.body.get('metadata[booking_id]'), 'booking-test-1')
  assert.equal(observed.body.get('customer_email'), 'verified@example.test')
  assert.equal(observed.body.get('payment_method_types[0]'), 'card')
  assert.equal(observed.init.headers['Idempotency-Key'], 'kiya_test_claim_test_1')
  assert.equal(observed.body.get('success_url'), 'https://kiya.example.test/payment/return?session_id={CHECKOUT_SESSION_ID}')
})

test('rejects live Stripe sessions, wrong amount, and malicious checkout redirects', async () => {
  const config = stripeTestConfig(env())
  const plan = calculatePaymentPlan(offer, 'full', 'initial', nowMs)
  for (const patch of [
    { livemode: true }, { amount_total: 5000 },
    { url: 'https://checkout.stripe.com.evil.test/sneaky' },
    { id: 'cs_live_never' },
  ]) {
    const gateway = stripeTestGateway(config, async () =>
      new Response(JSON.stringify({
        id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/one',
        status: 'open', payment_status: 'unpaid', currency: 'usd',
        amount_total: 19900, expires_at: plan.checkoutExpiresAtSeconds,
        livemode: false, ...patch,
      }), { status: 200 }),
    )
    await assert.rejects(() => gateway.createCheckout({ claimId: 'claim_test_1', plan, customerEmail: null }))
  }
})

test('attempts to expire orphaned test sessions after persistence failures', async () => {
  let called
  const gateway = stripeTestGateway(stripeTestConfig(env()), async (url, init) => {
    called = { url, init }
    return new Response(JSON.stringify({ status: 'expired' }), { status: 200 })
  })
  await gateway.expireCheckout('cs_test_one')
  assert.match(called.url, /cs_test_one\/expire$/)
  assert.equal(called.init.headers['Idempotency-Key'], 'kiya_expire_cs_test_one')
  await assert.rejects(() => gateway.expireCheckout('cs_live_one'))
})

test('verifies raw-body Stripe HMAC signature and rejects tampering and replay', () => {
  const original = signed(evt())
  assert.deepEqual(verifyStripeTestWebhook(original.body, original.header, env().STRIPE_WEBHOOK_SECRET, nowMs / 1000), evt())
  assert.throws(() => verifyStripeTestWebhook(original.body + ' ', original.header, env().STRIPE_WEBHOOK_SECRET, nowMs / 1000))
  assert.throws(() => verifyStripeTestWebhook(original.body, original.header, env().STRIPE_WEBHOOK_SECRET, nowMs / 1000 + 301))
  assert.throws(() => verifyStripeTestWebhook(original.body, 't=wrong,v1=bad', env().STRIPE_WEBHOOK_SECRET, nowMs / 1000))
  assert.throws(() => verifyStripeTestWebhook(original.body, null, env().STRIPE_WEBHOOK_SECRET, nowMs / 1000))
})

test('accepts only verified test checkout events and exact booking metadata', () => {
  const valid = parseVerifiedStripeEvent(evt())
  assert.equal(valid.amountTotalCents, 5000)
  assert.equal(valid.stage, 'initial')
  assert.equal(valid.choice, 'deposit')
  assert.equal(parseVerifiedStripeEvent({ ...evt(), type: 'customer.created' }), null)
  for (const invalid of [
    { livemode: true },
    { data: { object: { ...evt().data.object, amount_total: 9000.2 } } },
    { data: { object: { ...evt().data.object, client_reference_id: 'other' } } },
    { data: { object: { ...evt().data.object, id: 'cs_live_1' } } },
    { data: { object: { ...evt().data.object, livemode: true } } },
  ]) assert.throws(() => parseVerifiedStripeEvent(evt(invalid)))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { initiatePaymentCheckout, processVerifiedPaymentEvent } from '../lib/payments/payment-workflow.ts'

const now = 1_800_000_000_000
const offer = {
  bookingId: 'booking-1', customerId: 'user-1', serviceLabel: 'Standard Cleaning',
  currency: 'usd', totalCents: 15000, depositCents: 6000,
  approved: true, pricingApprovalId: 'approval-1', termsVersion: 'v1',
  status: 'held', offerExpiresAtMs: now + 3_600_000, reservationExpiresAtMs: now + 3_600_000,
}
const entry = () => ({
  actorId: 'user-1', bookingId: 'booking-1', choice: 'deposit', stage: 'initial',
})
function setup(changes = {}) {
  const calls = []
  const store = {
    async claimCheckout(args) { calls.push(['claim', args]); return { kind: 'claimed', claim: {
      claimId: 'claim-1', customerId: 'user-1', bookingId: 'booking-1',
      customerEmail: 'verified@example.test', offer,
    } } },
    async bindSession(args) { calls.push(['bind', args]); return true },
    async abandonClaim(id) { calls.push(['abandon', id]) },
    async recordVerifiedEvent(value) { calls.push(['event', value]); return 'processed' },
    ...changes.store,
  }
  const gateway = {
    async createCheckout(args) {
      calls.push(['stripe', args]); return {
        sessionId: 'cs_test_1', url: 'https://checkout.stripe.com/test',
        expiresAtSeconds: args.plan.checkoutExpiresAtSeconds,
      }
    },
    async expireCheckout(id) { calls.push(['expire', id]) },
    ...changes.gateway,
  }
  return { calls, store, gateway, deps: { store, gateway, nowMs: () => now } }
}

test('claims exact approved deposit and binds session before returning URL', async () => {
  const context = setup()
  const result = await initiatePaymentCheckout(entry(), context.deps)
  assert.equal(result.url, 'https://checkout.stripe.com/test')
  assert.deepEqual(context.calls.map(call => call[0]), ['claim','stripe','bind'])
  assert.equal(context.calls[1][1].plan.amountCents, 6000)
  assert.equal(context.calls[1][1].plan.balanceDueCents, 9000)
})

test('never starts a charge when amount or reservation approval is invalid', async () => {
  const context = setup({ store: { async claimCheckout() { return { kind: 'claimed', claim: {
    claimId: 'claim-2', customerId: 'user-1', bookingId: 'booking-1',
    customerEmail: null, offer: { ...offer, approved: false },
  } } } } })
  await assert.rejects(() => initiatePaymentCheckout(entry(), context.deps), /not ready/i)
  assert.equal(context.calls.some(call => call[0] === 'stripe'), false)
})

test('rejects other customers and unsupported choices without charging', async () => {
  const context = setup()
  await assert.rejects(() => initiatePaymentCheckout({ ...entry(), choice: 'free' }, context.deps), /Invalid payment request/)
  const other = setup()
  await assert.rejects(() => initiatePaymentCheckout({ ...entry(), actorId: 'user-2' }, other.deps), /ownership/i)
  assert.equal(other.calls.some(call => call[0] === 'stripe'), false)
})

test('reuses an already bound session returned by the atomic store', async () => {
  const context = setup({ store: { async claimCheckout() {
    return { kind: 'existing', url: 'https://checkout.stripe.com/test-existing', customerId: 'user-1', bookingId: 'booking-1', choice: 'deposit', stage: 'initial' }
  } } })
  assert.deepEqual(await initiatePaymentCheckout(entry(), context.deps),
    { existing: true, url: 'https://checkout.stripe.com/test-existing' })
  assert.deepEqual(context.calls, [])
})

test('rejects malicious saved Checkout redirects', async () => {
  const context = setup({ store: { async claimCheckout() {
    return { kind: 'existing', url: 'https://checkout.stripe.com.evil.example/steal', customerId: 'user-1', bookingId: 'booking-1', choice: 'deposit', stage: 'initial' }
  } } })
  await assert.rejects(() => initiatePaymentCheckout(entry(), context.deps), /could not be verified/i)
})

test('rejects a saved checkout session belonging to another customer', async () => {
  const context = setup({ store: { async claimCheckout() {
    return { kind: 'existing', url: 'https://checkout.stripe.com/valid',
      customerId: 'another-user', bookingId: 'booking-1', choice: 'deposit', stage: 'initial' }
  } } })
  await assert.rejects(() => initiatePaymentCheckout(entry(), context.deps), /ownership/i)
})

test('expires an orphaned Stripe session rather than showing an unpaid checkout link', async () => {
  const context = setup({ store: { async bindSession() { return false } } })
  await assert.rejects(() => initiatePaymentCheckout(entry(), context.deps), /could not be reserved/i)
  assert.equal(context.calls.some(call => call[0] === 'expire'), true)
})

test('does not return a session when Stripe creation fails', async () => {
  const context = setup({ gateway: { async createCheckout() { throw new Error('Stripe unavailable') } } })
  await assert.rejects(() => initiatePaymentCheckout(entry(), context.deps), /temporarily unavailable/i)
  assert.equal(context.calls.some(call => call[0] === 'abandon'), true)
})

test('webhook only acknowledges persisted paid, pending, failed, expired or duplicate events', async () => {
  const event = { eventId: 'evt_test_1', eventType: 'checkout.session.completed',
    sessionId: 'cs_test_1', bookingId: 'booking-1', claimId: 'claim-1',
    stage: 'initial', choice: 'deposit', paymentStatus: 'paid',
    amountTotalCents: 6000, currency: 'usd', livemode: false }
  const context = setup()
  assert.equal(await processVerifiedPaymentEvent(event, context.store), 'processed')
  assert.equal(context.calls.at(-1)[1].result, 'paid')
  const pending = setup()
  await processVerifiedPaymentEvent({ ...event, paymentStatus: 'unpaid' }, pending.store)
  assert.equal(pending.calls.at(-1)[1].result, 'pending')
  const expired = setup()
  await processVerifiedPaymentEvent({ ...event, eventType: 'checkout.session.expired' }, expired.store)
  assert.equal(expired.calls.at(-1)[1].result, 'expired')
  const offline = setup({ store: { async recordVerifiedEvent() { return 'unavailable' } } })
  await assert.rejects(() => processVerifiedPaymentEvent(event, offline.store), /reconciliation/i)
})

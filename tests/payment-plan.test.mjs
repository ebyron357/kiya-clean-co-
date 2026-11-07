import test from 'node:test'
import assert from 'node:assert/strict'
import { calculatePaymentPlan, validatePaymentChoice, validatePaymentStage } from '../lib/payments/payment-plan.ts'

const now = 1_800_000_000_000
const offer = (update = {}) => ({
  bookingId: 'booking-test-1', customerId: 'customer-test-1',
  serviceLabel: 'Deep Cleaning', currency: 'usd',
  totalCents: 19900, depositCents: 5000,
  pricingApprovalId: 'approval-1', termsVersion: 'v1',
  approved: true, status: 'held',
  offerExpiresAtMs: now + 3_600_000,
  reservationExpiresAtMs: now + 3_600_000,
  ...update,
})

test('full payment uses the exact owner-approved total without a second charge', () => {
  const plan = calculatePaymentPlan(offer(), 'full', 'initial', now)
  assert.equal(plan.amountCents, 19900)
  assert.equal(plan.depositCents, 19900)
  assert.equal(plan.balanceDueCents, 0)
  assert.equal(plan.checkoutExpiresAtSeconds, Math.floor((now + 3_600_000) / 1000))
})

test('approved deposit shows exact initial and remaining amounts in cents', () => {
  const plan = calculatePaymentPlan(offer(), 'deposit', 'initial', now)
  assert.equal(plan.amountCents, 5000)
  assert.equal(plan.balanceDueCents, 14900)
  assert.equal(plan.totalCents, 19900)
})

test('deposit cannot be selected unless its amount has been approved', () => {
  assert.throws(() => calculatePaymentPlan(offer({ depositCents: null }), 'deposit', 'initial', now), /not configured/i)
  assert.equal(calculatePaymentPlan(offer({ depositCents: null }), 'full', 'initial', now).amountCents, 19900)
})

test('rejects fractional, negative, tiny, excessive or invalid deposit', () => {
  for (const deposit of [-1, 2.5, 0, 49, 19851, 20000, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => calculatePaymentPlan(offer({ depositCents: deposit }), 'deposit', 'initial', now))
  }
})

test('never fabricates pricing approval, status or valid booking hold', () => {
  for (const change of [
    { approved: false }, { termsVersion: '' }, { pricingApprovalId: '' },
    { currency: 'eur' }, { status: 'canceled' }, { totalCents: 49 },
    { totalCents: 100.5 }, { totalCents: Number.MAX_SAFE_INTEGER },
    { offerExpiresAtMs: now }, { reservationExpiresAtMs: now + 29 * 60000 },
  ]) {
    assert.throws(() => calculatePaymentPlan(offer(change), 'full', 'initial', now))
  }
})

test('balance payment is allowed only after a verified deposit was persisted', () => {
  assert.throws(() => calculatePaymentPlan(offer(), 'deposit', 'balance', now), /no verified balance/i)
  assert.throws(() => calculatePaymentPlan(offer({ status: 'deposit_paid' }), 'full', 'balance', now))
  const balance = calculatePaymentPlan(offer({ status: 'deposit_paid' }), 'deposit', 'balance', now)
  assert.equal(balance.amountCents, 14900)
  assert.equal(balance.balanceDueCents, 14900)
  assert.equal(balance.stage, 'balance')
})

test('no second charge is allowed on fully paid or canceled bookings', () => {
  for (const status of ['paid', 'canceled']) {
    assert.throws(() => calculatePaymentPlan(offer({ status }), 'deposit', 'balance', now))
  }
})

test('rejects arbitrary client payment choices and stages', () => {
  assert.equal(validatePaymentChoice('deposit'), true)
  assert.equal(validatePaymentChoice('full'), true)
  assert.equal(validatePaymentChoice('free'), false)
  assert.equal(validatePaymentStage('initial'), true)
  assert.equal(validatePaymentStage('balance'), true)
  assert.equal(validatePaymentStage('refund'), false)
  assert.throws(() => calculatePaymentPlan(offer(), 'free', 'initial', now))
})

test('does not mutate authoritative pricing snapshots', () => {
  const original = offer()
  const copy = structuredClone(original)
  calculatePaymentPlan(original, 'deposit', 'initial', now)
  assert.deepEqual(original, copy)
})

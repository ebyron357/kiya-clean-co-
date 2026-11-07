import { calculatePaymentPlan, validatePaymentChoice, validatePaymentStage } from './payment-plan.ts'
import type { ApprovedCheckoutOffer, PaymentChoice, PaymentPlan, PaymentStage } from './payment-plan'

export class PaymentWorkflowError extends Error {
  constructor(message: string, public readonly status = 503) { super(message) }
}

export type CheckoutClaim = {
  claimId: string
  customerId: string
  bookingId: string
  customerEmail: string | null
  offer: ApprovedCheckoutOffer
}
export type CheckoutResult = {
  sessionId: string
  url: string
  expiresAtSeconds: number
}
export type VerifiedCheckoutEvent = {
  eventId: string
  eventType: 'checkout.session.completed' |
    'checkout.session.async_payment_succeeded' |
    'checkout.session.async_payment_failed' | 'checkout.session.expired'
  sessionId: string
  bookingId: string
  claimId: string
  stage: PaymentStage
  choice: PaymentChoice
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required'
  amountTotalCents: number
  currency: 'usd'
  livemode: false
}
export interface PaymentStore {
  // Must run under a DB transaction/CAS lock with authenticated ownership,
  // approved final pricing/terms, an approved conflict-free reservation,
  // expiry, existing payment attempts, and unique idempotency. No read-then-
  // insert outside an atomic constraint.
  claimCheckout(input: { customerId: string; bookingId: string; choice: PaymentChoice; stage: PaymentStage; nowMs: number }):
    Promise<{ kind: 'claimed'; claim: CheckoutClaim } | { kind: 'existing'; url: string } | { kind: 'unavailable' }>
  // Atomically associates the Stripe session with the claim BEFORE exposing
  // the Checkout URL to the customer. Reject duplicate session IDs.
  bindSession(input: { claimId: string; sessionId: string; amountCents: number; expiresAtSeconds: number }): Promise<boolean>
  abandonClaim(claimId: string): Promise<void>
  // Atomic event ledger UNIQUE(eventId) + session reconciliation:
  // require exact claim/session/booking/choice/stage/amount/currency;
  // never confirm a booking after its reservation is lost/expired;
  // update deposit balance and outbox in one transaction.
  recordVerifiedEvent(input: VerifiedCheckoutEvent & { result: 'paid' | 'pending' | 'failed' | 'expired' }):
    Promise<'processed' | 'duplicate' | 'unavailable'>
}
export interface StripeCheckoutGateway {
  createCheckout(input: { claimId: string; customerEmail: string | null; plan: PaymentPlan }): Promise<CheckoutResult>
  expireCheckout(sessionId: string): Promise<void>
}
export type PaymentDependencies = {
  store: PaymentStore
  gateway: StripeCheckoutGateway
  nowMs: () => number
}

export async function initiatePaymentCheckout(
  input: { actorId: string; bookingId: string; choice: unknown; stage: unknown },
  deps: PaymentDependencies,
) {
  if (!input.actorId || !input.bookingId || !validatePaymentChoice(input.choice) || !validatePaymentStage(input.stage)) {
    throw new PaymentWorkflowError('Invalid payment request.', 400)
  }
  const { choice, stage } = input as { choice: PaymentChoice; stage: PaymentStage }
  const nowMs = deps.nowMs()
  const reservation = await deps.store.claimCheckout({
    customerId: input.actorId, bookingId: input.bookingId, choice, stage, nowMs,
  })
  if (reservation.kind === 'unavailable') throw new PaymentWorkflowError('Online payment is not available yet.')
  if (reservation.kind === 'existing') return { url: reservation.url, existing: true }
  const claim = reservation.claim
  if (claim.customerId !== input.actorId || claim.bookingId !== input.bookingId || !claim.claimId) {
    throw new PaymentWorkflowError('Booking ownership could not be verified.', 403)
  }
  let plan: PaymentPlan
  try { plan = calculatePaymentPlan(claim.offer, choice, stage, nowMs) }
  catch {
    await deps.store.abandonClaim(claim.claimId)
    throw new PaymentWorkflowError('This booking is not ready for payment.', 409)
  }
  if (plan.customerId !== input.actorId || plan.bookingId !== input.bookingId) {
    await deps.store.abandonClaim(claim.claimId)
    throw new PaymentWorkflowError('Booking ownership could not be verified.', 403)
  }

  let session: CheckoutResult
  try {
    session = await deps.gateway.createCheckout({ claimId: claim.claimId, customerEmail: claim.customerEmail, plan })
  } catch {
    await deps.store.abandonClaim(claim.claimId)
    throw new PaymentWorkflowError('The payment page is temporarily unavailable.')
  }
  let bound = false
  try {
    bound = await deps.store.bindSession({
      claimId: claim.claimId, sessionId: session.sessionId,
      amountCents: plan.amountCents, expiresAtSeconds: session.expiresAtSeconds,
    })
  } catch { bound = false }
  if (!bound) {
    // A remotely created session must be expired if local persistence fails.
    // If Stripe expiration also fails, flag reconciliation, never return URL.
    try { await deps.gateway.expireCheckout(session.sessionId) } catch {
      throw new PaymentWorkflowError('Payment requires manual reconciliation before retry.')
    }
    throw new PaymentWorkflowError('The booking could not be reserved for payment.')
  }
  return { url: session.url, existing: false }
}

export async function processVerifiedPaymentEvent(event: VerifiedCheckoutEvent, store: PaymentStore) {
  const result: 'paid' | 'pending' | 'failed' | 'expired' =
    event.eventType === 'checkout.session.expired' ? 'expired' :
    event.eventType === 'checkout.session.async_payment_failed' ? 'failed' :
    event.paymentStatus === 'paid' ? 'paid' : 'pending'
  const saved = await store.recordVerifiedEvent({ ...event, result })
  if (saved === 'unavailable') throw new PaymentWorkflowError('Payment reconciliation is unavailable.')
  return saved
}

// Safety placeholder. No shared production tables may be guessed; replace only
// after a reviewed schema, RLS, reservation constraint, and idempotency audit.
export const unconfiguredPaymentStore: PaymentStore = {
  async claimCheckout() { return { kind: 'unavailable' } },
  async bindSession() { return false },
  async abandonClaim() {},
  async recordVerifiedEvent() { return 'unavailable' },
}

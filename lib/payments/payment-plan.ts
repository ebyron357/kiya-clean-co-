// Payment amounts are calculated exclusively from a durable, owner-approved
// server-side offer. Never accept amounts, percentages, or approval flags from
// a browser, URL, or Stripe redirect.
export type PaymentChoice = 'full' | 'deposit'
export type PaymentStage = 'initial' | 'balance'

export type ApprovedCheckoutOffer = {
  bookingId: string
  customerId: string
  serviceLabel: string
  currency: 'usd'
  totalCents: number
  depositCents: number | null
  pricingApprovalId: string
  termsVersion: string
  approved: boolean
  status: 'held' | 'deposit_paid' | 'paid' | 'canceled'
  offerExpiresAtMs: number
  reservationExpiresAtMs: number
}

export type PaymentPlan = {
  bookingId: string
  customerId: string
  serviceLabel: string
  currency: 'usd'
  choice: PaymentChoice
  stage: PaymentStage
  amountCents: number
  totalCents: number
  depositCents: number
  balanceDueCents: number
  termsVersion: string
  pricingApprovalId: string
  checkoutExpiresAtSeconds: number
}

const MIN_PAYMENT_CENTS = 50 // USD minimum for card Checkout; verify Stripe account limits at activation.
const MAX_AMOUNT_CENTS = 100_000_000
const MIN_CHECKOUT_SECONDS = 30 * 60
const MAX_CHECKOUT_SECONDS = 24 * 60 * 60

export class PaymentPlanError extends Error {
  constructor(message = 'This booking is not ready for payment.') { super(message) }
}

function validText(input: unknown, max = 200) {
  return typeof input === 'string' && input.trim().length > 0 && input.trim().length <= max
}
function whole(value: unknown, max = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max
}
export function validatePaymentChoice(value: unknown): value is PaymentChoice {
  return value === 'full' || value === 'deposit'
}
export function validatePaymentStage(value: unknown): value is PaymentStage {
  return value === 'initial' || value === 'balance'
}

export function calculatePaymentPlan(
  offer: ApprovedCheckoutOffer,
  choice: PaymentChoice,
  stage: PaymentStage,
  nowMs: number,
): PaymentPlan {
  if (!validatePaymentChoice(choice) || !validatePaymentStage(stage)) throw new PaymentPlanError()
  if (!validText(offer.bookingId) || !validText(offer.customerId) ||
      !validText(offer.pricingApprovalId) || !validText(offer.termsVersion) ||
      !validText(offer.serviceLabel, 80) || !whole(nowMs) ||
      offer.currency !== 'usd' || offer.approved !== true ||
      !whole(offer.totalCents, MAX_AMOUNT_CENTS) || offer.totalCents < MIN_PAYMENT_CENTS ||
      !whole(offer.offerExpiresAtMs) || !whole(offer.reservationExpiresAtMs)) {
    throw new PaymentPlanError()
  }

  const configuredDeposit = offer.depositCents
  if (configuredDeposit !== null &&
      (!whole(configuredDeposit, MAX_AMOUNT_CENTS) ||
        configuredDeposit < MIN_PAYMENT_CENTS ||
        configuredDeposit > offer.totalCents - MIN_PAYMENT_CENTS)) {
    throw new PaymentPlanError('The approved deposit terms are invalid.')
  }
  if (choice === 'deposit' && configuredDeposit === null) throw new PaymentPlanError('Deposits are not configured for this booking.')
  const depositCents = choice === 'deposit' ? configuredDeposit! : offer.totalCents
  const balanceDueCents = offer.totalCents - depositCents

  if (stage === 'initial') {
    if (offer.status !== 'held' || offer.offerExpiresAtMs <= nowMs) throw new PaymentPlanError('The approved quote or reservation has expired.')
    // Stripe-hosted sessions cannot expire in less than 30 minutes. We must
    // never allow a payment page outliving the authoritative booking hold.
    const endMs = Math.min(offer.offerExpiresAtMs, offer.reservationExpiresAtMs, nowMs + MAX_CHECKOUT_SECONDS * 1000)
    const checkoutExpiresAtSeconds = Math.floor(endMs / 1000)
    if (checkoutExpiresAtSeconds < Math.ceil(nowMs / 1000) + MIN_CHECKOUT_SECONDS) {
      throw new PaymentPlanError('The booking hold is too short for secure checkout.')
    }
    return { bookingId: offer.bookingId, customerId: offer.customerId,
      serviceLabel: offer.serviceLabel, currency: 'usd', choice, stage,
      amountCents: depositCents, totalCents: offer.totalCents, depositCents,
      balanceDueCents, termsVersion: offer.termsVersion,
      pricingApprovalId: offer.pricingApprovalId, checkoutExpiresAtSeconds }
  }

  // Balance is payable only after a verified deposit has been persisted.
  // No second charge can be created for a fully paid or canceled booking.
  if (choice !== 'deposit' || offer.status !== 'deposit_paid' || balanceDueCents < MIN_PAYMENT_CENTS) {
    throw new PaymentPlanError('There is no verified balance available for payment.')
  }
  return { bookingId: offer.bookingId, customerId: offer.customerId,
    serviceLabel: offer.serviceLabel, currency: 'usd', choice, stage,
    amountCents: balanceDueCents, totalCents: offer.totalCents, depositCents,
    balanceDueCents, termsVersion: offer.termsVersion,
    pricingApprovalId: offer.pricingApprovalId,
    checkoutExpiresAtSeconds: Math.floor(nowMs / 1000) + 60 * 60 }
}

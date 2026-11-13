import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PaymentPlan } from './payment-plan'
import type { CheckoutResult, StripeCheckoutGateway, VerifiedCheckoutEvent } from './payment-workflow'

export class StripeTestError extends Error {
  constructor(message = 'Stripe test checkout is not configured.') { super(message) }
}
export type StripeTestConfig = { secretKey: string; webhookSecret: string | null; origin: string }
export function stripeTestConfig(env: NodeJS.ProcessEnv): StripeTestConfig {
  if (env.KIYA_STRIPE_TEST_ENABLED !== 'true' ||
      !env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ||
      env.STRIPE_SECRET_KEY.length < 16) throw new StripeTestError()
  let origin: URL
  try { origin = new URL(env.KIYA_CHECKOUT_ORIGIN || '') }
  catch { throw new StripeTestError('A verified Checkout origin is required.') }
  if (origin.protocol !== 'https:' || origin.username || origin.password ||
      origin.search || origin.hash || origin.pathname !== '/') {
    throw new StripeTestError('Checkout requires a trusted HTTPS origin.')
  }
  return {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') ? env.STRIPE_WEBHOOK_SECRET : null,
    origin: origin.origin,
  }
}

function checkoutBody(claimId: string, customerEmail: string | null, plan: PaymentPlan, origin: string) {
  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(claimId)) throw new StripeTestError('Invalid checkout claim.')
  if (customerEmail !== null && (!/^\S+@\S+\.\S+$/.test(customerEmail) || customerEmail.length > 254)) {
    throw new StripeTestError('Invalid verified customer email.')
  }
  const body = new URLSearchParams({
    mode: 'payment',
    'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(plan.amountCents),
    'line_items[0][price_data][product_data][name]': plan.stage === 'balance' ?
      'Kiya Clean Co. - Remaining cleaning balance' :
      plan.choice === 'deposit' ? 'Kiya Clean Co. - Cleaning deposit' : 'Kiya Clean Co. - Cleaning service',
    'line_items[0][quantity]': '1',
    'client_reference_id': plan.bookingId,
    'metadata[booking_id]': plan.bookingId,
    'metadata[claim_id]': claimId,
    'metadata[stage]': plan.stage,
    'metadata[choice]': plan.choice,
    'metadata[terms_version]': plan.termsVersion,
    'payment_intent_data[metadata][booking_id]': plan.bookingId,
    'payment_intent_data[metadata][claim_id]': claimId,
    success_url: origin + '/payment/return?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/payment/return?canceled=1',
    expires_at: String(plan.checkoutExpiresAtSeconds),
  })
  if (customerEmail) body.set('customer_email', customerEmail)
  return body
}

export function stripeTestGateway(
  config: StripeTestConfig,
  fetcher: typeof fetch = fetch,
): StripeCheckoutGateway {
  return {
    async createCheckout({ claimId, customerEmail, plan }): Promise<CheckoutResult> {
      const payload = checkoutBody(claimId, customerEmail, plan, config.origin)
      const response = await fetcher('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + config.secretKey,
          'Stripe-Version': '2026-10-28.endive',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': 'kiya_test_' + claimId,
        },
        body: payload.toString(),
        signal: AbortSignal.timeout(12000),
      })
      if (!response.ok) throw new StripeTestError('Stripe test checkout could not be created.')
      const data: unknown = await response.json()
      if (!data || typeof data !== 'object') throw new StripeTestError('Unrecognized Checkout response.')
      const s = data as Record<string, unknown>
      if (s.livemode !== false || typeof s.id !== 'string' || !s.id.startsWith('cs_test_') ||
          s.status !== 'open' || s.payment_status !== 'unpaid' || s.currency !== 'usd' ||
          s.amount_total !== plan.amountCents || s.expires_at !== plan.checkoutExpiresAtSeconds ||
          typeof s.url !== 'string') throw new StripeTestError('Unexpected Stripe Checkout response.')
      let url: URL
      try { url = new URL(s.url) } catch { throw new StripeTestError('Invalid Stripe Checkout URL.') }
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' ||
          url.username || url.password) throw new StripeTestError('Checkout URL not trusted.')
      return { sessionId: s.id, url: s.url, expiresAtSeconds: s.expires_at as number }
    },
    async expireCheckout(sessionId: string) {
      if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) throw new StripeTestError('Invalid session.')
      const response = await fetcher(
        'https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sessionId) + '/expire', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + config.secretKey,
            'Stripe-Version': '2026-10-28.endive',
            'Idempotency-Key': 'kiya_expire_' + sessionId,
          },
          signal: AbortSignal.timeout(12000),
        },
      )
      if (!response.ok) throw new StripeTestError('Stripe session could not be expired.')
    },
  }
}

// Stripe signs: HMAC_SHA256(secret, timestamp + "." + exact raw bytes).
// Only raw request bodies are valid. No json reserialization or query-string secrets.
export function verifyStripeTestWebhook(
  rawBody: string,
  signature: string | null,
  secret: string | null,
  nowSeconds = Math.floor(Date.now() / 1000),
): unknown {
  if (!secret?.startsWith('whsec_') || !signature || !Number.isSafeInteger(nowSeconds) ||
      rawBody.length > 131072) throw new StripeTestError('Invalid webhook signature.')
  const parts = signature.split(',').map(part => part.trim().split('='))
  const timestamps = parts.filter(part => part[0] === 't' && /^\d+$/.test(part[1] || ''))
  const candidates = parts.filter(part => part[0] === 'v1' && /^[0-9a-f]{64}$/.test(part[1] || ''))
  if (timestamps.length !== 1 || candidates.length === 0) throw new StripeTestError('Invalid webhook signature.')
  const time = Number(timestamps[0][1])
  if (!Number.isSafeInteger(time) || Math.abs(nowSeconds - time) > 300) throw new StripeTestError('Webhook outside allowed time.')
  const expected = createHmac('sha256', secret).update(String(time) + '.' + rawBody, 'utf8').digest()
  if (!candidates.some(part => timingSafeEqual(expected, Buffer.from(part[1], 'hex')))) {
    throw new StripeTestError('Invalid webhook signature.')
  }
  try { return JSON.parse(rawBody) }
  catch { throw new StripeTestError('Invalid event payload.') }
}

const TYPES = new Set([
  'checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed', 'checkout.session.expired',
])
export function parseVerifiedStripeEvent(event: unknown): VerifiedCheckoutEvent | null {
  if (!event || typeof event !== 'object') throw new StripeTestError('Invalid Stripe event.')
  const value = event as Record<string, unknown>
  if (typeof value.type !== 'string' || !TYPES.has(value.type)) return null
  const envelope = value.data as { object?: Record<string, unknown> } | undefined
  const session = envelope?.object
  const metadata = session?.metadata as Record<string, unknown> | undefined
  if (value.livemode !== false || !String(value.id).startsWith('evt_') ||
      session?.object !== 'checkout.session' || session.livemode !== false ||
      typeof session.id !== 'string' || !session.id.startsWith('cs_test_') ||
      !metadata || typeof metadata.booking_id !== 'string' ||
      typeof metadata.claim_id !== 'string' ||
      !['initial','balance'].includes(String(metadata.stage)) ||
      !['full','deposit'].includes(String(metadata.choice)) ||
      session.client_reference_id !== metadata.booking_id ||
      session.currency !== 'usd' ||
      !Number.isSafeInteger(session.amount_total) ||
      (session.amount_total as number) < 50 ||
      !['paid','unpaid','no_payment_required'].includes(String(session.payment_status))) {
    throw new StripeTestError('Event did not match a test Checkout session.')
  }
  return {
    eventId: String(value.id),
    eventType: value.type as VerifiedCheckoutEvent['eventType'],
    sessionId: session.id,
    bookingId: metadata.booking_id,
    claimId: metadata.claim_id,
    stage: metadata.stage as VerifiedCheckoutEvent['stage'],
    choice: metadata.choice as VerifiedCheckoutEvent['choice'],
    paymentStatus: session.payment_status as VerifiedCheckoutEvent['paymentStatus'],
    amountTotalCents: session.amount_total as number,
    currency: 'usd',
    livemode: false,
  }
}

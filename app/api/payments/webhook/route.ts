import { NextResponse } from 'next/server'
import { processVerifiedPaymentEvent, PaymentWorkflowError, unconfiguredPaymentStore } from '@/lib/payments/payment-workflow'
import { parseVerifiedStripeEvent, stripeTestConfig, verifyStripeTestWebhook } from '@/lib/payments/stripe-test'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let config
  try {
    config = stripeTestConfig(process.env)
    if (!config.webhookSecret) throw new Error('Missing webhook secret')
  } catch {
    return NextResponse.json({ error: 'Webhook processing is unavailable.' }, { status: 503 })
  }

  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return NextResponse.json({ error: 'Invalid content type.' }, { status: 415 })
  }
  const contentLength = request.headers.get('content-length')
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > 131072)) {
    return NextResponse.json({ error: 'Webhook too large.' }, { status: 413 })
  }
  try {
    // Stripe webhooks are not same-origin browser requests. Authenticate
    // using the raw payload and Stripe-Signature, not Origin or cookies.
    const raw = await request.text()
    if (Buffer.byteLength(raw, 'utf8') > 131072) {
      return NextResponse.json({ error: 'Webhook too large.' }, { status: 413 })
    }
    const payload = verifyStripeTestWebhook(raw, request.headers.get('stripe-signature'), config.webhookSecret)
    const event = parseVerifiedStripeEvent(payload)
    if (!event) return NextResponse.json({ received: true, ignored: true })
    const result = await processVerifiedPaymentEvent(event, unconfiguredPaymentStore)
    return NextResponse.json({ received: true, duplicate: result === 'duplicate' })
  } catch (error) {
    if (error instanceof PaymentWorkflowError) {
      // Deliberately return non-2xx until an atomic datastore can reconcile
      // signed events, so Stripe can retry rather than losing payment events.
      return NextResponse.json({ error: 'Payment reconciliation is unavailable.' }, { status: error.status })
    }
    return NextResponse.json({ error: 'Webhook rejected.' }, { status: 400 })
  }
}

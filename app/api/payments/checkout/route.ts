import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { readJsonRequest, RequestError } from '@/lib/request-validation'
import { initiatePaymentCheckout, PaymentWorkflowError, unconfiguredPaymentStore } from '@/lib/payments/payment-workflow'
import { stripeTestConfig, stripeTestGateway, StripeTestError } from '@/lib/payments/stripe-test'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const payloadSchema = z.object({
  bookingId: z.string().uuid(),
  choice: z.enum(['full', 'deposit']),
  stage: z.enum(['initial', 'balance']),
}).strict()

export async function POST(request: Request) {
  // An explicit test-mode gate prevents accidental use of live Stripe keys.
  let config
  try { config = stripeTestConfig(process.env) }
  catch { return NextResponse.json({ error: 'Online payment is not available yet.' }, { status: 503 }) }

  try {
    const parsed = payloadSchema.safeParse(await readJsonRequest(request, 4096))
    if (!parsed.success) throw new RequestError('Invalid checkout request.', 400)
    const db = await createClient()
    const { data: { user }, error } = await db.auth.getUser()
    if (error || !user?.id) return NextResponse.json({ error: 'Sign in to pay for a confirmed booking.' }, { status: 401 })

    const result = await initiatePaymentCheckout(
      { actorId: user.id, ...parsed.data },
      { store: unconfiguredPaymentStore, gateway: stripeTestGateway(config), nowMs: Date.now },
    )
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof RequestError || error instanceof PaymentWorkflowError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof StripeTestError) return NextResponse.json({ error: 'Online payment is unavailable.' }, { status: 503 })
    console.error('[kiya payments] Checkout could not be started.')
    return NextResponse.json({ error: 'Unable to start payment.' }, { status: 503 })
  }
}

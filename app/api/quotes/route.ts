import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { quoteSchema } from '@/lib/quote-schema'
import { calculateQuote } from '@/lib/pricing'
import { sameQuoteSubmission } from '@/lib/quote-idempotency'
import { readJsonRequest, RequestError } from '@/lib/request-validation'

export async function POST(request: Request) {
  try {
    const parsed = quoteSchema.safeParse(await readJsonRequest(request))
    if (!parsed.success) throw new RequestError('Please check your request details.', 400)
    const q = parsed.data
    const db = adminClient()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const bucket = createHash('sha256').update(`quote:${ip}`).digest('hex')
    const { data: allowed, error: limitError } = await db.rpc('kiya_check_rate_limit', {
      bucket, max_hits: 8, window_seconds: 3600,
    })
    if (limitError) throw limitError
    if (!allowed) throw new RequestError('Too many requests. Please try again later.', 429)
    const client = await createClient()
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError && authError.name !== 'AuthSessionMissingError') throw authError
    const { submissionId, name, email, phone, zip, consent, marketing, website, ...details } = q
    const record = {
      submission_id: submissionId, user_id: user?.id ?? null,
      customer_name: name, email, phone, zip,
      details: { ...details, pricing: calculateQuote(null, details.extras) },
      marketing_consent: marketing,
    }
    const { error } = await db.from('kiya_quotes').insert(record)
    if (error) {
      if (error.code !== '23505') throw error
      // Only an existing submission ID is a retry. A different unique violation
      // must never be reported to the customer as a successfully saved request.
      const existing = await db.from('kiya_quotes').select('submission_id,user_id,customer_name,email,phone,zip,marketing_consent,details').eq('submission_id', submissionId).maybeSingle()
      if (existing.error || !existing.data) throw error
      if (!sameQuoteSubmission(existing.data, record)) throw new RequestError('This request identifier was already used. Reload to start a new request.', 409)
    }
    return NextResponse.json({ success: true, message: 'Your request has been saved. This is not a confirmed booking.' }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[kiya] Quote submission failed')
    return NextResponse.json({ error: 'We could not save your request. Please try again.' }, { status: 503 })
  }
}

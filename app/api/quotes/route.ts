import { after, NextResponse } from 'next/server'
import { sendQuoteNotifications } from '@/lib/quote-notifications'
import { createHash } from 'node:crypto'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { quoteRepository } from '@/lib/supabase/quote-repository'
import { quoteSchema } from '@/lib/quote-schema'
import { submitQuote, QuoteSubmissionError } from '@/lib/quote-submission'
import { readJsonRequest, RequestError } from '@/lib/request-validation'

export async function POST(request: Request) {
  try {
    const parsed = quoteSchema.safeParse(await readJsonRequest(request))
    if (!parsed.success) throw new RequestError('Please check your request details.', 400)
    const db = adminClient()
    const result = await submitQuote(parsed.data, {
      onInserted(submissionId) {
        after(async () => {
          const status = await sendQuoteNotifications(submissionId, {
            mode: process.env.KIYA_EMAIL_MODE,
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.KIYA_EMAIL_FROM,
            testRecipient: process.env.KIYA_EMAIL_TEST_RECIPIENT,
          })
          // Static error code only: never log provider bodies or customer data.
          if (status === 'failed') console.error('[kiya] Sandbox quote notification failed')
        })
      },
      repository: quoteRepository({
        from: () => ({
          insert: async record => {
            const { error } = await db.from('kiya_quotes').insert(record)
            return { error }
          },
          select: columns => ({ eq: (column, value) => ({ maybeSingle: async () => {
            const { data, error } = await db.from('kiya_quotes').select(columns).eq(column, value).maybeSingle()
            return { data, error }
          } }) }),
        }),
      }),
      async rateLimit() {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const bucket = createHash('sha256').update(`quote:${ip}`).digest('hex')
        const { data, error } = await db.rpc('kiya_check_rate_limit', { bucket, max_hits: 8, window_seconds: 3600 })
        if (error) throw new Error('Rate limit unavailable')
        return data === true
      },
      async authenticatedUser() {
        const client = await createClient()
        const { data: { user }, error } = await client.auth.getUser()
        if (error && error.name !== 'AuthSessionMissingError') throw new Error('Authentication unavailable')
        return user?.id ?? null
      },
    })
    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof RequestError || error instanceof QuoteSubmissionError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[kiya] Quote submission failed')
    return NextResponse.json({ error: 'We could not save your request. Please try again.' }, { status: 503 })
  }
}

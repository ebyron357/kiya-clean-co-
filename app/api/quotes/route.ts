import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { quoteSchema } from '@/lib/quote-schema'

export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  if (origin) {
    try {
      const source = new URL(origin)
      if (source.host !== host || !['https:', 'http:'].includes(source.protocol)) throw new Error('origin_mismatch')
    } catch {
      return NextResponse.json({ error: 'Please submit this form from our website.' }, { status: 403 })
    }
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Please submit this form from our website.' }, { status: 403 })
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported request format.' }, { status: 415 })
  }
  if (Number(request.headers.get('content-length') || 0) > 12000) {
    return NextResponse.json({ error: 'Your request is too large.' }, { status: 413 })
  }
  let body: unknown
  try {
    const reader = request.body?.getReader()
    if (!reader) throw new Error('Empty body')
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 12000) { await reader.cancel(); return NextResponse.json({ error: 'Your request is too large.' }, { status: 413 }) }
      chunks.push(value)
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return NextResponse.json({ error: 'Please check your form and try again.' }, { status: 400 })
  }
  const parsed = quoteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and consent before submitting.' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) return NextResponse.json({ error: 'Quote requests are temporarily unavailable. Please try again later.' }, { status: 503 })
  try {
    const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
    const data = parsed.data
    const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const hash = (value: string) => createHmac('sha256', secret).update(value).digest('hex')
    for (const [key, max] of [[`ip:${hash(ip)}`, 10], [`email:${hash(data.email)}`, 4]] as const) {
      const limit = await db.rpc('kiya_check_rate_limit', { bucket: `homepage-quote:${key}`, max_hits: max, window_seconds: 3600 })
      if (limit.error) throw new Error('rate_limit_unavailable')
      if (!limit.data) return NextResponse.json({ error: 'Too many requests. Please try again in an hour.' }, { status: 429, headers: { 'Retry-After': '3600' } })
    }
    const { error } = await db.from('kiya_quotes').upsert({
      submission_id: data.submissionId,
      customer_name: data.name,
      email: data.email,
      phone: data.phone,
      zip: data.zip,
      status: 'requested',
      marketing_consent: false,
      details: { service: data.service, frequency: data.frequency, bedrooms: data.bedrooms, notes: data.notes, contact_consent: true, source: 'kiya-homepage', privacy_version: '2026-11-12' },
    }, { onConflict: 'submission_id', ignoreDuplicates: true })
    if (error) throw new Error('quote_storage_unavailable')
    return NextResponse.json({ success: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Quote submission failed', error instanceof Error ? error.message : 'unexpected_error')
    return NextResponse.json({ error: 'We couldn’t save your request. Please try again. Your details are still here.' }, { status: 503 })
  }
}

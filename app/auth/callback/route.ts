import { createClient } from '@/lib/supabase/server'
import { authCallbackDestination } from '@/lib/account-recovery'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const destination = authCallbackDestination(url.searchParams.get('next'))
  if (code && !url.searchParams.has('error')) {
    try {
      const client = await createClient()
      const { error } = await client.auth.exchangeCodeForSession(code)
      if (!error) return NextResponse.redirect(new URL(destination, url.origin), {
        headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
      })
    } catch { /* Never log authorization codes or provider error details. */ }
  }
  const failure = destination === '/auth/reset-password' ? '/auth/forgot-password?error=link' : '/auth/login?error=link'
  return NextResponse.redirect(new URL(failure, url.origin), {
    headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
  })
}

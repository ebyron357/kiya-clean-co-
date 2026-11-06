'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { completeAccountRecovery, requestAccountRecovery } from '@/lib/account-recovery'

// Remains off until isolated Auth redirects, rate limits, and owned-inbox
// delivery are verified. Never use a NEXT_PUBLIC flag to authorize this action.
const enabled = () => process.env.AUTH_RECOVERY_ENABLED === 'true'

export async function requestRecovery(_previous: { message: string }, form: FormData) {
  const origin = (await headers()).get('origin') || ''
  return requestAccountRecovery(Object.fromEntries(form), origin, {
    enabled: enabled(),
    async send(email, redirectTo) {
      const client = await createClient()
      return client.auth.resetPasswordForEmail(email, { redirectTo })
    },
  })
}

export async function updateRecoveryPassword(_previous: { message: string; success: boolean }, form: FormData) {
  // Authentication is repeated inside the action, not trusted from page gating.
  // Password updates always use the caller's session, never the service-role key.
  let client: Awaited<ReturnType<typeof createClient>> | undefined
  return completeAccountRecovery(Object.fromEntries(form), {
    enabled: enabled(),
    async authenticated() {
      client = await createClient()
      const { data: { user }, error } = await client.auth.getUser()
      return !error && !!user?.email_confirmed_at
    },
    async update(password) {
      if (!client) return false
      const { error } = await client.auth.updateUser({ password })
      return !error
    },
  })
}

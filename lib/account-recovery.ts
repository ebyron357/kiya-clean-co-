import { z } from 'zod'

export const recoveryEmailSchema = z.object({ email: z.email().max(254) })
export const recoveryPasswordSchema = z.object({
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
  confirmation: z.string().max(128),
}).refine(value => value.password === value.confirmation, {
  message: 'Passwords must match.', path: ['confirmation'],
})
export const recoveryReceipt = 'If recovery is available for that email, you will receive a link. Open it in the same browser where you made this request.'
export const recoveryUnavailable = 'Account recovery is not enabled yet. No recovery email has been requested.'

// No arbitrary `next` URLs, protocol-relative URLs or query strings are accepted.
export function authCallbackDestination(next: string | null) {
  return next === '/auth/reset-password' ? '/auth/reset-password' : '/account'
}

export type RecoveryDependencies = {
  enabled: boolean
  send: (email: string, redirectTo: string) => Promise<unknown>
}
export async function requestAccountRecovery(input: unknown, origin: string, dependencies: RecoveryDependencies) {
  if (!dependencies.enabled) return { message: recoveryUnavailable }
  const parsed = recoveryEmailSchema.safeParse(input)
  if (!parsed.success) return { message: 'Enter a valid email address.' }
  let callback: URL
  try {
    const target = new URL(origin)
    if (target.username || target.password || target.search || target.hash || target.pathname !== '/' ||
        (target.protocol !== 'https:' && !(target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname)))) {
      return { message: 'Unable to verify this request. Please reload.' }
    }
    callback = new URL('/auth/callback', target.origin)
    callback.searchParams.set('next', '/auth/reset-password')
  } catch { return { message: 'Unable to verify this request. Please reload.' } }
  // Identical response for unknown accounts, throttles and provider failures.
  // Provider-side rate limiting must be configured and tested before enabling.
  try { await dependencies.send(parsed.data.email, callback.toString()) } catch { /* No provider errors or account existence leaked. */ }
  return { message: recoveryReceipt }
}

export type PasswordDependencies = {
  enabled: boolean
  authenticated: () => Promise<boolean>
  update: (password: string) => Promise<boolean>
}
export async function completeAccountRecovery(input: unknown, dependencies: PasswordDependencies) {
  if (!dependencies.enabled) return { message: recoveryUnavailable, success: false }
  const parsed = recoveryPasswordSchema.safeParse(input)
  if (!parsed.success) return { message: 'Use matching passwords with 12–128 characters.', success: false }
  try {
    if (!await dependencies.authenticated()) return { message: 'Your session is missing or expired. Request a new recovery link.', success: false }
    if (!await dependencies.update(parsed.data.password)) return { message: 'Password could not be changed. Request a new link or try again later.', success: false }
    return { message: 'Your password has been updated. You can return to your account.', success: true }
  } catch { return { message: 'Password could not be changed. Request a new link or try again later.', success: false } }
}

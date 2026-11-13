'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestRecovery, updateRecoveryPassword } from '@/app/auth/recovery-actions'

export function RecoveryRequestForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(requestRecovery, { message: '' })
  return <form action={action}>
    {!enabled && <p className="status-note" role="status">Account recovery is not enabled yet. No email will be sent from this form.</p>}
    <div className="field"><label htmlFor="recovery-email">Account email</label><input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={!enabled}/></div>
    {state.message && <p role="status" className="status-note">{state.message}</p>}
    <button className="button primary" disabled={!enabled || pending}>{pending ? 'Requesting link…' : 'Request recovery link'}</button>
    <Link className="text-link" href="/auth/login">Back to sign in</Link>
  </form>
}

export function RecoveryPasswordForm() {
  const [state, action, pending] = useActionState(updateRecoveryPassword, { message: '', success: false })
  return <form action={action}>
    {!state.success && <>
      <div className="field"><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="password-help"/></div>
      <p className="muted" id="password-help">Use a unique password with 12–128 characters. A password manager can help.</p>
      <div className="field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></div>
    </>}
    {state.message && <p role="status" className="status-note">{state.message}</p>}
    {state.success ? <Link className="button primary" href="/account">Return to my account</Link> : <button className="button primary" disabled={pending}>{pending ? 'Updating…' : 'Update my password'}</button>}
  </form>
}

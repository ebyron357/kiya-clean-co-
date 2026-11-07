import { AuthForm } from '@/components/auth-form'
import { RecoveryPasswordForm, RecoveryRequestForm } from '@/components/recovery-form'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export const metadata = { title: 'Your Kiya Account', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AuthPage({ params, searchParams }: {
  params: Promise<{ mode: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { mode } = await params
  if (!['login', 'signup', 'forgot-password', 'reset-password'].includes(mode)) notFound()
  const enabled = process.env.AUTH_RECOVERY_ENABLED === 'true'
  if (mode === 'reset-password') {
    if (!enabled) redirect('/auth/forgot-password')
    const client = await createClient()
    const { data: { user }, error } = await client.auth.getUser()
    if (error || !user?.email_confirmed_at) redirect('/auth/forgot-password?error=link')
  }
  const recovery = mode === 'forgot-password' || mode === 'reset-password'
  const { error } = await searchParams
  return <main className="shell section"><div className="auth-box">
    <div className="page-intro"><p className="eyebrow">KIYA ACCOUNT</p>
      <h1>{mode === 'signup' ? 'Create your account.' : mode === 'forgot-password' ? 'Reset your password.' : mode === 'reset-password' ? 'Set a new password.' : 'Sign in to Kiya.'}</h1>
      <p>{mode === 'signup' ? 'View your quote requests and save cleaning preferences.' : recovery ? 'We will help you restore access to your account.' : 'View cleaning requests and preferences in your account.'}</p>
    </div>
    {error === 'link' && <p className="status-note" role="alert">That link is invalid or expired. Request a new link and open it in the same browser.</p>}
    {mode === 'forgot-password' ? <RecoveryRequestForm enabled={enabled}/> : mode === 'reset-password' ? <RecoveryPasswordForm/> : <AuthForm signup={mode === 'signup'}/>}
  </div></main>
}

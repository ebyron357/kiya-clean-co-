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
    <div className="page-intro"><p className="eyebrow">A LITTLE PLACE OF YOUR OWN</p>
      <h1>{mode === 'signup' ? 'Make yourself at home.' : mode === 'forgot-password' ? 'Find your way back.' : mode === 'reset-password' ? 'A fresh start for your account.' : 'Welcome home.'}</h1>
      <p>{mode === 'signup' ? 'Keep your quote requests and cleaning preferences in one thoughtful place.' : recovery ? 'Secure access to your little corner of Kiya.' : 'Your requests, your preferences, your little corner of Kiya.'}</p>
    </div>
    {error === 'link' && <p className="status-note" role="alert">That link is invalid or expired. Request a new link and open it in the same browser.</p>}
    {mode === 'forgot-password' ? <RecoveryRequestForm enabled={enabled}/> : mode === 'reset-password' ? <RecoveryPasswordForm/> : <AuthForm signup={mode === 'signup'}/>}
  </div></main>
}

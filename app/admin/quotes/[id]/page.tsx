import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Quote request details', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : 'Not specified'
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? String(value) : 'Not specified'

export default async function QuoteRequestDetails({ params }: { params: Promise<{ id: string }> }) {
  const session = await createClient()
  const { data: { user }, error: authError } = await session.auth.getUser()
  if (authError || !user) redirect('/auth/login')
  if (user.app_metadata?.role !== 'admin') return <main className="shell section"><section className="content-panel"><h1>Owner access only.</h1><p>A trusted administrator role is required to view customer requests.</p><Link className="button primary" href="/account">Return to my account</Link></section></main>
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  // Only after trusted-role authorization. No new schema or status assumptions.
  const { data: quote, error } = await adminClient().from('kiya_quotes').select('id,customer_name,email,phone,zip,status,created_at,details,marketing_consent').eq('id', id).maybeSingle()
  if (error) return <main className="shell section"><section className="content-panel"><h1>Request unavailable.</h1><p role="alert">The request could not be loaded. Return to the list and retry.</p><Link className="button outline" href="/admin">Back to requests</Link></section></main>
  if (!quote) notFound()
  const details = quote.details && typeof quote.details === 'object' && !Array.isArray(quote.details) ? quote.details : {}
  const extras = Array.isArray(details.extras) ? details.extras.filter((value: unknown) => typeof value === 'string') : []
  const rows = [
    ['Customer', text(quote.customer_name)], ['Email', text(quote.email)], ['Phone', text(quote.phone)],
    ['ZIP', text(quote.zip)], ['Status', text(quote.status)], ['Service', text(details.service)],
    ['Bedrooms', number(details.bedrooms)], ['Bathrooms', number(details.bathrooms)], ['Square feet', number(details.squareFeet)],
    ['Condition', text(details.condition)], ['Pets', text(details.pets)], ['Frequency', text(details.frequency)],
    ['Preferred date (not reserved)', text(details.preferredDate)], ['Extras', extras.length ? extras.join(', ') : 'None requested'],
    ['Marketing consent', quote.marketing_consent === true ? 'Opted in' : 'Not opted in'],
  ]
  return <main className="shell section"><Link href="/admin" className="text-link">← Back to owner workspace</Link>
    <header className="page-intro"><p className="eyebrow">CUSTOMER REQUEST · OWNER ONLY</p><h1>Every detail, considered.</h1><p>Review the saved request before agreeing scope, price or availability. No booking, payment or notification is triggered by opening this page.</p></header>
    <section className="content-panel"><h2>Request details</h2><dl className="lead-details">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section className="content-panel"><h2>Customer instructions</h2><p className="customer-notes">{text(details.notes)}</p></section>
    <section className="content-panel"><h2>Next steps</h2><p className="status-note">Estimate preparation, approval, booking conversion and notifications are not enabled. This view is read-only; it does not change the request status.</p><p>Use owner-approved pricing and coverage only. A preferred date is not verified availability.</p></section>
  </main>
}

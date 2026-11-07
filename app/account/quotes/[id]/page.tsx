import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { customerQuote } from '@/lib/customer-quotes'
import { withdrawQuote } from '@/app/account/actions'

export const metadata = { title: 'My cleaning request', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function MyQuote({ params }: { params: Promise<{ id: string }> }) {
  const session = await createClient()
  const { data: { user }, error } = await session.auth.getUser()
  if (error || !user) redirect('/auth/login')
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  // Session-scoped client: preserve RLS as well as explicit ownership filtering.
  let quote: Awaited<ReturnType<typeof customerQuote>>
  try {
    quote = await customerQuote({
      from: () => ({ select: columns => ({ eq: (column, value) => ({ eq: (owner, ownerId) => ({ maybeSingle: async () => {
        const { data, error } = await session.from('kiya_quotes').select(columns).eq(column, value).eq(owner, ownerId).maybeSingle()
        return { data, error }
      } }) }) }) }),
    }, user.id, id)
  }
  catch { return <main className="shell section"><section className="content-panel"><h1>We couldn’t load your request.</h1><p role="alert">Please return to your account and try again.</p><Link href="/account" className="button outline">Back to my account</Link></section></main> }
  if (!quote) notFound()
  const rows = [
    ['Service', quote.service], ['Status', quote.status], ['ZIP code', quote.zip],
    ['Bedrooms', quote.bedrooms], ['Bathrooms', quote.bathrooms], ['Square feet', quote.squareFeet],
    ['Frequency preference', quote.frequency], ['Preferred date (not reserved)', quote.preferredDate],
    ['Home condition', quote.condition], ['Pets', quote.pets], ['Requested extras', quote.extras.join(', ')],
  ]
  return <main className="shell section"><Link href="/account" className="text-link">← My account</Link>
    <header className="page-intro"><p className="eyebrow">YOUR CLEANING REQUEST</p><h1>Your home, your details.</h1><p>Here’s what you shared with Kiya. This request is not a confirmed appointment, invoice or payment.</p></header>
    <section className="content-panel"><h2>Request summary</h2><dl className="lead-details">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not specified'}</dd></div>)}</dl><h3>Your instructions</h3><p className="customer-notes">{quote.notes || 'No extra instructions supplied.'}</p></section>
    <section className="content-panel"><h2>What happens next?</h2><p>Coverage, scope, price and appointment availability must be confirmed before service. No payment has been taken by this request.</p><p className="status-note">Online estimate acceptance and booking conversion are not enabled yet. No amount or appointment slot is promised here.</p>
      {quote.status === 'requested' && <form action={withdrawQuote}><input type="hidden" name="id" value={quote.id}/><button className="button outline">Withdraw pending request</button></form>}
      <Link href="/contact" className="text-link">Contact & FAQ →</Link>
    </section>
  </main>
}

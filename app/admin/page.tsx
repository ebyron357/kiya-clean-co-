import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { isOwner } from '@/lib/owner-access'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Owner request inbox', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
const pageSize = 25

export default async function Admin({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const db = await createClient()
  const { data: { user }, error: authError } = await db.auth.getUser()
  if (authError || !user) redirect('/auth/login')
  if (!isOwner(user)) return <main className="shell section"><div className="content-panel"><h1>Owner access only.</h1><p>This area requires a trusted administrator role. Creating a customer account never grants administrator access.</p><Link href="/account" className="button primary">Return to my account</Link></div></main>

  const params = await searchParams
  const status = ['requested', 'withdrawn'].includes(params.status || '') ? params.status! : ''
  const page = /^\d{1,4}$/.test(params.page || '') ? Math.max(1, Number(params.page)) : 1
  let query = adminClient().from('kiya_quotes').select('id,customer_name,email,zip,status,created_at,details', { count: 'exact' })
  if (status) query = query.eq('status', status)
  const { data, error, count } = await query.order('created_at', { ascending: false }).order('id').range((page - 1) * pageSize, page * pageSize - 1)
  const href = (next: number) => `/admin?${new URLSearchParams({ ...(status ? { status } : {}), page: String(next) })}`

  return <main className="shell section">
    <header className="page-intro"><p className="eyebrow">OWNER WORKSPACE</p><h1>Quote request inbox.</h1><p>Review requests and prepare your follow-up. A saved request is not a confirmed booking.</p></header>
    <section className="content-panel" aria-labelledby="inbox-heading">
      <h2 id="inbox-heading">Incoming requests</h2>
      <form className="inbox-filters" action="/admin" method="get">
        <div className="field"><label htmlFor="status">Request status</label><select id="status" name="status" defaultValue={status}><option value="">All statuses</option><option value="requested">Requested</option><option value="withdrawn">Withdrawn</option></select></div>
        <button className="button primary">Apply filter</button>
      </form>
      <p className="muted">{error ? 'Count unavailable.' : `${count ?? 0} request${count === 1 ? '' : 's'}.`} Newest first. Customer details are visible only to trusted owners.</p>
      {error ? <p role="alert">Requests could not be loaded. Please refresh.</p> : data?.length ? <ul className="inbox-list">{data.map(q => {
        const service = q.details && typeof q.details.service === 'string' ? q.details.service : 'Cleaning request'
        return <li key={q.id}><article><h3>{q.customer_name} · {service}</h3><p className="customer-notes">{q.email} · ZIP {q.zip}</p><p className="muted">{q.status} · {new Date(q.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p><Link className="text-link" href={`/admin/quotes/${q.id}`}>Review request →</Link></article></li>
      })}</ul> : <p>No requests on this page. Try another filter or page.</p>}
      {!error && <nav className="account-nav" aria-label="Inbox pages">{page > 1 && <Link className="button outline" href={href(page - 1)}>Previous page</Link>}<span className="muted">Page {page}</span>{page * pageSize < (count || 0) && <Link className="button outline" href={href(page + 1)}>Next page</Link>}</nav>}
    </section>
    <section className="content-panel"><h2>Before launch</h2><p className="status-note">This inbox is read-only. Follow-up status changes, estimate approval, job scheduling, and payment collection need reviewed database transactions and approved business rules.</p><ul className="check-list"><li>Verify database isolation and owner/customer access.</li><li>Approve contact details, service areas, response times, rates and cancellation rules.</li><li>Configure and test email delivery; the adapter is sandbox-only.</li><li>Complete the atomic reservation/payment store before enabling bookings.</li></ul></section>
  </main>
}

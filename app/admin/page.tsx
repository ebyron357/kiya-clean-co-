import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OwnerInbox } from '@/components/owner-inbox'
import { dollars, pricingConfig } from '@/lib/booking-prices'
export const metadata = { title: 'Administration', robots: { index: false, follow: false } }

export default async function Admin() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) redirect('/auth/login')
  if (user.app_metadata?.role !== 'admin') return <main className="shell section"><section className="content-panel"><h1>Owner access only.</h1><p>This area requires the trusted administrator role. Creating a customer account never grants owner access.</p><Link href="/account" className="button primary">Return to my account</Link></section></main>
  const db = adminClient()
  const [bookings, customers, members, quotes] = await Promise.all([
    db.from('bookings').select('id,service,frequency,status,price_cents,created_at,availability_slots(starts_at,ends_at)').order('created_at', {ascending:false}).limit(100),
    db.from('customers').select('id,name,email,phone').order('created_at', {ascending:false}).limit(100),
    db.from('memberships').select('id', {head:true,count:'exact'}).eq('status','active'),
    db.from('kiya_quotes').select('id,customer_name,email,zip,status,created_at,details').order('created_at',{ascending:false}).limit(100),
  ])
  return <main className="shell section"><header className="page-intro"><p className="eyebrow">KIYA OWNER WORKSPACE</p><h1>Care starts here.</h1><p>Review bookings and incoming requests. Payment and delivery actions remain off until their storage and security requirements are in place.</p></header>
    <p className="delivery-warning" role="status"><strong>Email and SMS delivery are off.</strong> Inquiries are saved, but no messages are sent. The message_log table does not exist, so held messages and resending are not available. No notification has been recorded as delivered.</p>
    <nav className="town-links" aria-label="Owner sections"><a href="#bookings">Bookings</a><a href="#customers">Customers</a><a href="#circle">Circle seats</a><a href="#inbox">Client Care inbox</a><a href="#readiness">Launch requirements</a></nav>
    <section className="content-panel owner-section" id="bookings"><h2>Recent bookings</h2><p>Latest 100 records. Completion, cancellation charges, lockout charges, refunds, and availability editing are not enabled.</p>{bookings.error ? <p role="alert">Bookings could not be loaded. Refresh to retry.</p> : !bookings.data?.length ? <p>No bookings yet.</p> : bookings.data.map(booking => {
      const slot = Array.isArray(booking.availability_slots) ? booking.availability_slots[0] : booking.availability_slots
      return <article className="owner-record" key={booking.id}><h3>{booking.service}</h3><p>{booking.frequency} · {dollars(booking.price_cents)} · {booking.status.replaceAll('_',' ')}</p>{slot && <p>{new Date(slot.starts_at).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'})} Eastern</p>}<p className="inquiry-help">Reference: {booking.id}</p></article>
    })}</section>
    <div className="portal-grid"><section className="content-panel owner-section" id="customers"><h2>Customers</h2><p>Latest 100 customers.</p>{customers.error ? <p role="alert">Customers could not be loaded. Refresh to retry.</p> : !customers.data?.length ? <p>No booking customers yet.</p> : customers.data.map(customer => <article className="owner-record" key={customer.id}><h3>{customer.name}</h3><p><a href={`mailto:${customer.email}`}>{customer.email}</a></p><p>{customer.phone}</p></article>)}</section><section className="content-panel owner-section" id="circle"><h2>Kiya Circle</h2>{members.error ? <p role="alert">Membership count could not be loaded.</p> : <p>{members.count} active members · {pricingConfig.circle.capacity} seat limit</p>}<p>Membership activation, rate locks, monthly perks, referral credits, and pause controls need the payment lifecycle before they can be enabled safely.</p></section></div>
    <section className="content-panel"><h2>Recent quote requests</h2>{quotes.error ? <p role="alert">Quote requests could not be loaded. Refresh to retry.</p> : !quotes.data?.length ? <p>No quote requests yet.</p> : quotes.data.map(quote => <article className="owner-record" key={quote.id}><h3>{quote.customer_name}</h3><p>{typeof quote.details?.service === 'string' ? quote.details.service : 'Cleaning request'} · {quote.status}</p><p><a href={`mailto:${quote.email}`}>{quote.email}</a> · ZIP {quote.zip}</p></article>)}</section>
    <OwnerInbox/>
    <section className="content-panel owner-section" id="readiness"><h2>What is needed before paid bookings launch?</h2><ul className="check-list"><li>Stripe is connected, but STRIPE_WEBHOOK_SECRET is not configured and payment processing is not implemented.</li><li>Database support for Stripe customer references, saved-card consent, payment attempts, refunds, event deduplication, and payment_issue status is required.</li><li>Resend and Twilio delivery, a durable message log, scheduled reminders, and opt-out handling are not configured.</li><li>Secure billing and membership storage are required before automated fees or credits can run.</li><li>Owner settings, availability management, review moderation, and customer self-service changes remain to be implemented.</li></ul><fieldset disabled aria-describedby="delivery-setup"><legend>Notification delivery</legend><label className="choice"><input type="checkbox" role="switch" name="EMAIL_ENABLED" checked={false} readOnly/>Email delivery — off</label><label className="choice"><input type="checkbox" role="switch" name="SMS_ENABLED" checked={false} readOnly/>SMS delivery — off</label></fieldset><p id="delivery-setup">These controls are disabled because delivery providers and durable logging are not configured. No scripts or configuration changes were applied.</p></section>
  </main>
}

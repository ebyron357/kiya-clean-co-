import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { inquirySchema } from '@/lib/inquiry-validation'

function ContactDetails({ email, phone }: { email: string; phone?: string }) {
  return <p><a href={`mailto:${email}`}>{email}</a>{phone && <> · <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a></>}</p>
}
export async function OwnerInbox() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') return null
  const db = adminClient()
  const [jobs, contacts, waitlist, partners] = await Promise.all([
    db.from('job_applications').select('id,name,email,phone,zip,details,created_at').order('created_at', { ascending: false }).limit(100),
    db.from('contact_messages').select('id,name,email,phone,message,created_at').order('created_at', { ascending: false }).limit(100),
    db.from('waitlist').select('id,email,zip,created_at').order('created_at', { ascending: false }).limit(100),
    db.from('partners').select('id,name,company,email,phone,monthly_units,notes,created_at').order('created_at', { ascending: false }).limit(100),
  ])
  return <section id="inbox" className="owner-section"><h2>Client Care inbox</h2><p>Latest 100 records per category. Requests are saved here; no notification delivery is implied.</p><div className="portal-grid">
    <section className="content-panel"><h3>Job applications</h3>{jobs.error ? <p role="alert">Applications could not be loaded. Refresh to retry.</p> : !jobs.data?.length ? <p>No applications yet.</p> : jobs.data.map(job => {
      const application = inquirySchema.shape.application.safeParse(job.details?.application)
      return <article className="owner-record" key={job.id}><h4>{job.name}</h4><ContactDetails email={job.email} phone={job.phone}/><p>ZIP {job.zip}</p>{application.success && application.data && <p>{application.data.town} · {application.data.yearsExperience} years of experience<br/>{application.data.daysAvailable.join(', ')}<br/>Reliable transportation: {application.data.reliableTransportation}</p>}{typeof job.details?.message === 'string' && <p>{job.details.message}</p>}</article>
    })}</section>
    <section className="content-panel"><h3>Contact messages</h3>{contacts.error ? <p role="alert">Messages could not be loaded. Refresh to retry.</p> : !contacts.data?.length ? <p>No messages yet.</p> : contacts.data.map(contact => <article className="owner-record" key={contact.id}><h4>{contact.name}</h4><ContactDetails email={contact.email} phone={contact.phone}/><p>{contact.message}</p></article>)}</section>
    <section className="content-panel"><h3>Service waitlist</h3>{waitlist.error ? <p role="alert">Waitlist could not be loaded. Refresh to retry.</p> : !waitlist.data?.length ? <p>No waitlist requests yet.</p> : waitlist.data.map(entry => <article className="owner-record" key={entry.id}><ContactDetails email={entry.email}/><p>ZIP {entry.zip}</p></article>)}</section>
    <section className="content-panel"><h3>Partner leads</h3>{partners.error ? <p role="alert">Partner leads could not be loaded. Refresh to retry.</p> : !partners.data?.length ? <p>No partner leads yet.</p> : partners.data.map(partner => <article className="owner-record" key={partner.id}><h4>{partner.name} · {partner.company}</h4><ContactDetails email={partner.email} phone={partner.phone}/><p>{partner.monthly_units} units per month</p><p>{partner.notes}</p></article>)}</section>
  </div></section>
}

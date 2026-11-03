import 'server-only'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { dollars } from '@/lib/booking-prices'

export async function AccountBookings() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return null
  const customer = await db.from('customers').select('id').eq('user_id', user.id).maybeSingle()
  if (customer.error) return <section className="content-panel" id="bookings"><h2>Your bookings</h2><p role="alert">Your bookings could not be loaded. Refresh to retry.</p></section>
  const bookings = customer.data ? await db.from('bookings').select('id,service,frequency,status,price_cents,created_at,availability_slots(starts_at,ends_at)').eq('customer_id', customer.data.id).order('created_at', { ascending: false }).limit(50) : null
  return <section className="content-panel" id="bookings"><h2>Your bookings</h2>{bookings?.error ? <p role="alert">Your bookings could not be loaded. Refresh to retry.</p> : !bookings?.data?.length ? <p>No bookings are linked to your account yet. Guest requests are not matched by email alone, to protect your privacy.</p> : bookings.data.map(booking => {
    const slot = Array.isArray(booking.availability_slots) ? booking.availability_slots[0] : booking.availability_slots
    return <article className="owner-record" key={booking.id}><h3>{booking.service}</h3><p>{booking.frequency} · {dollars(booking.price_cents)} · {booking.status.replaceAll('_', ' ')}</p>{slot && <p>{new Date(slot.starts_at).toLocaleString('en-US', {timeZone:'America/New_York', dateStyle:'medium', timeStyle:'short'})}–{new Date(slot.ends_at).toLocaleTimeString('en-US', {timeZone:'America/New_York',hour:'numeric',minute:'2-digit'})} Eastern</p>}{booking.status === 'pending_payment' && <p>Not confirmed. Card saving is not yet available; no charge has been taken.</p>}</article>
  })}<p>Online card updates, receipts, rescheduling, cancellation, and plan pauses are not active yet. Contact Client Care to discuss a change; sending a request does not confirm it.</p><Link href="/contact" className="text-link">Contact Client Care</Link></section>
}

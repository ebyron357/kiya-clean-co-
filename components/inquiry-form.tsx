'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { applicationDays } from '@/lib/inquiry-validation'

export function InquiryForm({ kind, zip = '' }: { kind: 'waitlist' | 'career' | 'contact'; zip?: string }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submission = useRef({ id: '', payload: '' })
  const submitting = useRef(false)
  if (done) return <section className="content-panel" role="status"><h3>{kind === 'career' ? 'Your application is saved.' : kind === 'waitlist' ? 'You’re on the list.' : 'Your message is saved.'}</h3><p>{kind === 'career' ? 'Thank you for your interest in joining Kiya. The hiring team can review your application.' : kind === 'waitlist' ? 'Thank you for your interest. Client Care can review your request when coverage expands.' : 'Thank you for reaching out. Client Care can review your message.'}</p><p className="inquiry-help">Automatic email and text notifications are off. No confirmation email has been sent.</p><Link className="text-link" href="/">Back to Kiya</Link></section>
  return <form className="content-panel" aria-busy={busy} onSubmit={async event => {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setError('')
    const fields = new FormData(event.currentTarget)
    const payload = {kind, email: fields.get('email'), name: fields.get('name') || '', phone: fields.get('phone') || '', zip: zip || fields.get('zip'), message: fields.get('message') || '', consent: fields.get('consent') === 'on', website: fields.get('website') || '', ...(kind === 'career' ? {application: {town: fields.get('town'), yearsExperience: Number(fields.get('yearsExperience')), daysAvailable: fields.getAll('daysAvailable'), reliableTransportation: fields.get('reliableTransportation')}} : {})}
    const fingerprint = JSON.stringify(payload)
    if (submission.current.payload !== fingerprint) submission.current = {id: crypto.randomUUID(), payload: fingerprint}
    try {
      const response = await fetch('/api/inquiries', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...payload, submissionId: submission.current.id})})
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Please try again.')
      setDone(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'We could not save your request. Please try again.')
    } finally { setBusy(false); submitting.current = false }
  }}>
    <div className="form-grid">
      {kind !== 'waitlist' && <><label className="field">Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label><label className="field">Phone{kind === 'contact' ? ' (optional)' : ''}<input name="phone" type="tel" autoComplete="tel" required={kind === 'career'} maxLength={30}/></label></>}
      <label className="field">Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
      {!zip && <label className="field">ZIP code<input name="zip" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}" required maxLength={5}/></label>}
      {kind === 'career' && <><label className="field">Town<input name="town" autoComplete="address-level2" required minLength={2} maxLength={100}/></label><label className="field">Years of cleaning experience<input name="yearsExperience" type="number" inputMode="decimal" min={0} max={80} step="0.5" required/></label><fieldset className="full-width"><legend>Days available (choose at least one)</legend><div className="inquiry-days">{applicationDays.map(day => <label className="choice" key={day}><input type="checkbox" name="daysAvailable" value={day}/>{day}</label>)}</div></fieldset><fieldset className="full-width"><legend>Do you have reliable transportation?</legend><div className="inquiry-days"><label className="choice"><input name="reliableTransportation" type="radio" value="yes" required/>Yes</label><label className="choice"><input name="reliableTransportation" type="radio" value="no" required/>No</label></div></fieldset></>}
      {kind !== 'waitlist' && <label className="field full-width">{kind === 'career' ? 'Anything else we should know? (optional)' : 'How can we help?'}<textarea name="message" required={kind === 'contact'} minLength={kind === 'contact' ? 10 : undefined} maxLength={3000}/></label>}
      <label className="choice full-width"><input type="checkbox" name="consent" required/><span>I agree to be contacted about this request. This is not marketing or SMS consent. <Link href="/privacy" className="text-link">Privacy notice</Link></span></label>
    </div>
    <div hidden><input name="website" tabIndex={-1} autoComplete="off" aria-label="Website"/></div>
    {error && <p role="alert">{error}</p>}
    <button className="button primary" type="submit" disabled={busy}>{busy ? 'Saving…' : kind === 'waitlist' ? 'Join the waitlist' : kind === 'career' ? 'Send my application' : 'Send my message'}</button>
  </form>
}

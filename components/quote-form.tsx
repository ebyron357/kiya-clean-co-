'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react'
import { quoteSchema } from '@/lib/quote-schema'

export function QuoteForm({ initialService }: { initialService: 'standard' | 'deep' | 'move' }) {
  const [service, setService] = useState(initialService)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const submissionId = useRef<string | null>(null)
  const successHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setReady(true) }, [])
  useEffect(() => { if (success) successHeading.current?.focus() }, [success])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError('')
    const form = new FormData(event.currentTarget)
    submissionId.current ||= crypto.randomUUID()
    const input = { ...Object.fromEntries(form), service, submissionId: submissionId.current, consent: form.get('consent') === 'on' }
    const parsed = quoteSchema.safeParse(input)
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    setPending(true)
    try {
      const response = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.')
      setSuccess(true)
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to connect. Please try again.') }
    finally { setPending(false) }
  }
  return <section className="quote-section" id="quote"><div className="container quote-layout"><div className="quote-copy"><p className="section-label">Tell us about your home</p><h2>Let&apos;s get<br/>your quote.</h2><p>Send your details and cleaning requirements. We&apos;ll contact you to confirm availability and price.</p><p>No payment is required. Sending this form does not confirm a booking.</p></div>
    <div className="quote-card">{success ? <div className="quote-success" role="status"><span className="success-icon"><CheckCircle2 size={36}/></span><h3 ref={successHeading} tabIndex={-1}>Quote request received</h3><p>Your details have been saved. We&apos;ll contact you about availability and pricing.</p><p className="muted">This is a quote request, not a confirmed booking. No payment has been taken.</p><a href="#services" className="button button-outline">Explore our services <ArrowUpRight size={18}/></a></div> : <form onSubmit={submit} aria-busy={pending} data-ready={ready}><h3>Your details</h3><p className="form-intro">Optional fields are marked.</p><fieldset disabled={pending}><legend>What kind of clean?</legend><div className="service-picker">{([{id:'standard',name:'Standard'},{id:'deep',name:'Deep clean'},{id:'move',name:'Moving'}] as const).map(({id,name}) => <label className={`service-option ${service === id ? 'selected' : ''}`} key={id}><input type="radio" name="service" value={id} checked={service === id} onChange={() => setService(id)}/><span>{name}</span></label>)}</div><div className="form-grid"><label>Full name<input name="name" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={120}/></label><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254}/></label><label>ZIP code<input name="zip" inputMode="numeric" autoComplete="postal-code" placeholder="12345" pattern="[0-9]{5}" maxLength={5} required/></label><label>Phone <span className="optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number" maxLength={30}/></label><label>Bedrooms<select name="bedrooms" defaultValue="2"><option value="studio">Studio</option>{['1','2','3','4','5+'].map(n => <option value={n} key={n}>{n} {n === '1' ? 'bedroom' : 'bedrooms'}</option>)}</select></label><label>How often?<select name="frequency" defaultValue="once"><option value="once">Just this once</option><option value="weekly">Every week</option><option value="biweekly">Every two weeks</option><option value="monthly">Every month</option></select></label></div><label className="notes-label">Anything we should know? <span className="optional">(optional)</span><textarea name="notes" placeholder="Pets, areas to focus on, or special requirements" maxLength={2000} rows={3}/></label><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="consent"><input name="consent" type="checkbox" required/><span>I agree to be contacted about my quote and have read the <a href="/privacy" target="_blank" rel="noreferrer">privacy notice</a>.</span></label></fieldset>{error && <p role="alert" className="form-error">{error}</p>}<button className="button button-primary submit-button" type="submit" disabled={pending || !ready}>{pending ? <>Sending your request <Loader2 className="spinner" size={18}/></> : <>Get my free quote <ArrowUpRight size={19}/></>}</button><p className="form-bottom-note">Your information is used to respond to this request.</p></form>}</div>
  </div></section>
}

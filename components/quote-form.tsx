'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { quoteSchema } from '@/lib/quote-schema'
import { getQuoteService, quoteServiceHref, quoteDetailsSchema, quoteHomeSchema, quoteStepForField, quoteSteps, type QuoteDetails, type QuoteStep } from '@/lib/quote-flow'
import { SectionLink } from './section-link'
import { QuoteFields } from './quote-fields'
import { QuoteReview } from './quote-review'

const stepDescriptions = ['Choose a service and tell us about your space.', 'Where should we send your quote? Optional fields are marked.', 'Check your details before sending your request.']

export function QuoteForm({ initialService }: { initialService: QuoteDetails['service'] }) {
  const searchParams = useSearchParams()
  const service = searchParams ? getQuoteService(searchParams.get('service')) : initialService
  const [step, setStep] = useState<QuoteStep>(0)
  const [details, setDetails] = useState<QuoteDetails | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [ready, setReady] = useState(false)
  const submissionId = useRef<string | null>(null)
  const sending = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef<QuoteStep>(0)
  const successHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => { setReady(true) }, [])
  useEffect(() => { if (success) successHeading.current?.focus() }, [success])
  useEffect(() => {
    if (previousStep.current !== step) {
      stepHeading.current?.focus({ preventScroll: true })
      formRef.current?.scrollIntoView({ block: 'start' })
      previousStep.current = step
    }
    const field = formRef.current?.elements.namedItem(errorField)
    if (field instanceof HTMLElement) field.focus({ preventScroll: true })
  }, [step, errorField, error])

  function changeService(next: QuoteDetails['service']) {
    if (sending.current) return
    window.history.replaceState(null, '', quoteServiceHref(window.location.href, next))
  }

  function changeStep(next: QuoteStep) {
    setError('')
    setErrorField('')
    setStep(next)
  }

  function showValidationError(issue: { path: PropertyKey[]; message: string }) {
    const field = String(issue.path[0] ?? '')
    setStep(quoteStepForField(field))
    setErrorField(field)
    setError(issue.message)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || !ready) return
    setError('')
    setErrorField('')
    const form = new FormData(event.currentTarget)
    const values = { ...Object.fromEntries(form), service }

    if (step === 0) {
      const parsed = quoteHomeSchema.safeParse(values)
      if (!parsed.success) { showValidationError(parsed.error.issues[0]); return }
      changeStep(1)
      return
    }
    if (step === 1) {
      const parsed = quoteDetailsSchema.safeParse(values)
      if (!parsed.success) { showValidationError(parsed.error.issues[0]); return }
      setDetails(parsed.data)
      changeStep(2)
      return
    }

    submissionId.current ||= crypto.randomUUID()
    const input = { ...values, submissionId: submissionId.current, consent: form.get('consent') === 'on' }
    const parsed = quoteSchema.safeParse(input)
    if (!parsed.success) { showValidationError(parsed.error.issues[0]); return }
    sending.current = true
    setPending(true)
    try {
      const response = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.')
      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect. Please try again.')
    } finally {
      sending.current = false
      setPending(false)
    }
  }

  return <section className="quote-section" id="quote">
    <div className="container quote-layout">
      <div className="quote-copy">
        <h2>Request a quote</h2>
        <p>Tell us about your home. We&apos;ll contact you with availability and a price before you book.</p>
      </div>
      <div className="quote-card">
        {success ? <div className="quote-success" role="status">
          <h3 ref={successHeading} tabIndex={-1}>Quote request received</h3>
          <p>Your details have been saved. We&apos;ll contact you about availability and pricing.</p>
          <p className="muted">This is a quote request, not a confirmed booking. No payment has been taken.</p>
          <SectionLink href="#services" className="button button-outline">View services</SectionLink>
        </div> : <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending} data-ready={ready} onKeyDown={event => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) event.preventDefault() }}>
          <ol className="quote-progress" aria-label="Quote progress">
            {quoteSteps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} data-complete={index < step}><span aria-hidden="true">{index + 1}.</span> {label}</li>)}
          </ol>
          <h3 ref={stepHeading} tabIndex={-1}>{step === 2 ? 'Review your request' : quoteSteps[step]}</h3>
          <p className="form-intro">{stepDescriptions[step]}</p>
          <fieldset disabled={pending}>
            <legend className="sr-only">Quote request details</legend>
            <QuoteFields step={step} service={service} onServiceChange={changeService} errorField={errorField}/>
            <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
            <div hidden={step !== 2}>
              {details && <QuoteReview details={{ ...details, service }} onEdit={changeStep}/>}
              <label className="consent"><input name="consent" type="checkbox" required aria-invalid={errorField === 'consent' || undefined} aria-describedby={errorField === 'consent' ? 'quote-error' : undefined}/><span>I agree to be contacted about my quote and have read the <a href="/privacy" target="_blank" rel="noreferrer">privacy notice</a>.</span></label>
            </div>
          </fieldset>
          {error && <p id="quote-error" role="alert" className="form-error">{error}</p>}
          <div className="quote-navigation">
            {step > 0 && <button type="button" className="button button-outline" disabled={pending} onClick={() => changeStep(step === 2 ? 1 : 0)}>Back</button>}
            <button className="button button-primary quote-next" type="submit" disabled={pending || !ready}>
              {pending ? 'Sending…' : step === 2 ? 'Send request' : step === 0 ? 'Continue' : 'Review request'}
            </button>
          </div>
          <p className="form-bottom-note">{step === 2 ? 'No payment. No booking until you confirm.' : 'Your details are only sent when you submit the final step.'}</p>
        </form>}
      </div>
    </div>
  </section>
}

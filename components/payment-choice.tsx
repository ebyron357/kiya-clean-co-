'use client'

import { useState } from 'react'
import type { PaymentChoice, PaymentStage } from '@/lib/payments/payment-plan'

const money = (cents: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
}).format(cents / 100)

export function PaymentChoiceForm({
  bookingId, totalCents, depositCents, stage = 'initial',
}: {
  bookingId: string
  totalCents: number
  depositCents: number | null
  stage?: PaymentStage
}) {
  // This is a reusable component, intentionally NOT mounted on a public route
  // until the authenticated, durable booking/approved-price adapter exists.
  // All monetary props are for display only. The API ignores browser amounts.
  const [choice, setChoice] = useState<PaymentChoice>('full')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const depositAvailable = depositCents !== null && Number.isSafeInteger(depositCents) &&
    depositCents >= 50 && totalCents - depositCents >= 50

  async function beginPayment() {
    setError('')
    setBusy(true)
    try {
      const paymentChoice = stage === 'balance' ? 'deposit' : choice
      const response = await fetch('/api/payments/checkout', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, choice: paymentChoice, stage }),
      })
      const result: { url?: string; error?: string } = await response.json()
      if (!response.ok) throw new Error(result.error || 'Payment is unavailable.')
      if (!result.url) throw new Error('Payment is unavailable.')
      const destination = new URL(result.url)
      if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
        throw new Error('The payment page could not be verified.')
      }
      window.location.assign(result.url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Payment is unavailable.')
      setBusy(false)
    }
  }

  return (
    <section className="content-panel">
      <h2>{stage === 'balance' ? 'Pay the remaining balance' : 'Choose how to pay'}</h2>
      {stage === 'balance' ? (
        <p>Remaining amount due: <strong>{depositAvailable ? money(totalCents - depositCents!) : 'Not configured'}</strong></p>
      ) : (
        <fieldset className="payment-choice-options" disabled={busy}>
          <legend>Select a payment option</legend>
          <label className="choice">
            <input type="radio" checked={choice === 'full'} onChange={() => setChoice('full')} />
            Pay in full: {money(totalCents)}
          </label>
          {depositAvailable && (
            <label className="choice">
              <input type="radio" checked={choice === 'deposit'} onChange={() => setChoice('deposit')} />
              Pay deposit: {money(depositCents!)} now; {money(totalCents - depositCents!)} later
            </label>
          )}
        </fieldset>
      )}
      <p className="muted">Payments are collected through Stripe Checkout. The final price and booking terms must be approved before payment. A return to this site does not by itself confirm a booking.</p>
      {error && <p role="alert" className="status-note">{error}</p>}
      <button className="button primary" disabled={busy || (stage === 'balance' && !depositAvailable)} onClick={beginPayment}>
        {busy ? 'Opening secure checkout…' : 'Continue to secure payment'}
      </button>
    </section>
  )
}

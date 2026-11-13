import Link from 'next/link'

export const metadata = {
  title: 'Payment Verification',
  robots: { index: false, follow: false },
}

export default async function PaymentReturn() {
  // Never trust session_id or canceled query parameters as payment proof.
  // Authoritative paid/booked status comes from a signed Stripe event and
  // durable server-side reconciliation, not from the browser redirect.
  return (
    <main className="shell section">
      <div className="page-intro">
        <p className="eyebrow">PAYMENT VERIFICATION</p>
        <h1>Check your booking status.</h1>
        <p>A return from Stripe does not confirm payment or reserve an appointment.
          We will update your account only after the payment and booking have been verified.</p>
        <Link className="button primary" href="/account">View my account</Link>
      </div>
    </main>
  )
}

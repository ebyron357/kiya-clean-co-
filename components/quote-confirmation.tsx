'use client'

import { useEffect, useRef } from 'react'
import type { QuoteInput } from '@/lib/quote-schema'
import { frequencyLabels, serviceLabels } from '@/lib/quote-flow'
import { SectionLink } from './section-link'

export function QuoteConfirmation({ receipt }: { receipt: QuoteInput }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => { heading.current?.focus() }, [])

  return <div className="quote-success" role="status">
    <h3 ref={heading} tabIndex={-1}>Quote request received</h3>
    <p>Your request is saved. We&apos;ll contact you to confirm availability and price.</p>
    <dl className="confirmation-details">
      <div><dt>Cleaning</dt><dd>{serviceLabels[receipt.service]}</dd></div>
      <div><dt>Home</dt><dd>{receipt.bedrooms === 'studio' ? 'Studio' : `${receipt.bedrooms} ${receipt.bedrooms === '1' ? 'bedroom' : 'bedrooms'}`} · {receipt.zip}</dd></div>
      <div><dt>Frequency</dt><dd>{frequencyLabels[receipt.frequency]}</dd></div>
      <div><dt>Contact email</dt><dd>{receipt.email}</dd></div>
      {receipt.phone && <div><dt>Phone</dt><dd>{receipt.phone}</dd></div>}
    </dl>
    <p className="muted">No booking is confirmed and no payment has been taken.</p>
    <SectionLink href="#services" className="button button-outline">View services</SectionLink>
  </div>
}

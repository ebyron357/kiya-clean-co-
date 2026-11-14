import { frequencyLabels, serviceLabels, type QuoteDetails, type QuoteStep } from '@/lib/quote-flow'

export function QuoteReview({ details, onEdit }: { details: QuoteDetails; onEdit: (step: QuoteStep) => void }) {
  const bedrooms = details.bedrooms === 'studio' ? 'Studio' : `${details.bedrooms} ${details.bedrooms === '1' ? 'bedroom' : 'bedrooms'}`

  return <div className="quote-review">
    <section className="review-group" aria-labelledby="review-home-title">
      <div className="review-heading"><h4 id="review-home-title">Your home</h4><button type="button" className="review-edit" onClick={() => onEdit(0)} aria-label="Edit home details">Edit</button></div>
      <dl className="review-details">
        <div><dt>Cleaning</dt><dd>{serviceLabels[details.service]}</dd></div>
        <div><dt>Home</dt><dd>{bedrooms} · {details.zip}</dd></div>
        <div><dt>Frequency</dt><dd>{frequencyLabels[details.frequency]}</dd></div>
      </dl>
    </section>
    <section className="review-group" aria-labelledby="review-contact-title">
      <div className="review-heading"><h4 id="review-contact-title">Contact details</h4><button type="button" className="review-edit" onClick={() => onEdit(1)} aria-label="Edit contact details">Edit</button></div>
      <dl className="review-details">
        <div><dt>Name</dt><dd>{details.name}</dd></div>
        <div><dt>Email</dt><dd>{details.email}</dd></div>
        {details.phone && <div><dt>Phone</dt><dd>{details.phone}</dd></div>}
        {details.notes && <div className="review-notes"><dt>Notes</dt><dd>{details.notes}</dd></div>}
      </dl>
    </section>
  </div>
}

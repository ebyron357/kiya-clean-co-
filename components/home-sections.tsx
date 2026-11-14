import { ChevronDown, Plus } from 'lucide-react'
import { SectionLink } from './section-link'

export function Hero() {
  return (
    <section className="hero-shell" aria-labelledby="hero-title">
      <div className="container hero">
        <h1 id="hero-title">Regular, deep &amp; <span className="whitespace-nowrap">move-out</span> cleaning.</h1>
        <div className="hero-copy">
          <p className="hero-description">Tell us your ZIP code, home size, and the clean you need. We&apos;ll confirm availability and price before you book.</p>
          <SectionLink className="button hero-button" href="#quote">Get a free quote</SectionLink>
        </div>
      </div>
    </section>
  )
}

const services = [
  { id: 'standard', name: 'Standard cleaning', text: 'Routine cleaning for occupied homes.', items: ['Kitchen and bathroom surfaces', 'Dusting and vacuuming', 'Mopping floors'] },
  { id: 'deep', name: 'Deep cleaning', text: 'A detailed clean for areas that need more attention.', items: ['Standard cleaning tasks', 'Buildup on surfaces', 'Baseboards and hard-to-reach areas'] },
  { id: 'move', name: 'Move-in / move-out', text: 'Cleaning an empty home before or after a move.', items: ['Kitchen, bathrooms, and floors', 'Inside cabinets', 'Inside drawers'] },
]
export function Services() {
  return (
    <section className="container section" id="services">
      <div className="section-heading"><h2>Cleaning services</h2></div>
      <div className="service-list">
        {services.map(({ id, name, text, items }) => (
          <details className="service-item" key={id}>
            <summary aria-labelledby={`service-${id}-name`} aria-describedby={`service-${id}-description`}>
              <span className="service-summary-copy">
                <span className="service-name" id={`service-${id}-name`}>{name}</span>
                <span className="service-description" id={`service-${id}-description`}>{text}</span>
              </span>
              <ChevronDown className="service-toggle" size={20} aria-hidden="true" />
            </summary>
            <div className="service-inclusions">
              <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
              <SectionLink className="service-link" href={`?service=${id}#quote`}>Request a quote<span className="sr-only"> for {name.toLowerCase()}</span></SectionLink>
            </div>
          </details>
        ))}
      </div>
      <p className="section-footnote">We confirm the cleaning checklist and price before booking.</p>
    </section>
  )
}
export function HowItWorks() {
  return <section className="booking-section" id="how-it-works"><div className="container booking-layout"><div className="booking-heading"><h2>How booking works</h2></div><ol className="steps">{[
    ['Request a quote', 'Choose a service and send your home details.'],
    ['Review the price', 'We confirm service coverage, the cleaning checklist, and the cost.'],
    ['Confirm a date', 'Agree on an available date before the booking is confirmed.'],
  ].map(([title, text]) => <li className="step" key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>
}
export function Faq() {
  return <section className="container section faq" id="faq"><div><h2>Common questions</h2></div><div className="faq-items">{[
    ['How much will my cleaning cost?', 'Your quote depends on the size and condition of your home, the type of cleaning, and any special requests. Tell us a little about your space and we’ll review the details with you before you commit.'],
    ['Do you clean in my area?', 'Include your ZIP code in the quote request. We’ll confirm whether we can serve your address before discussing a booking.'],
    ['Can I request a recurring clean?', 'Yes—select weekly, every two weeks, or monthly in your request. Frequency and availability will be confirmed when we discuss your quote.'],
    ['Do I need to book or pay right now?', 'No. This is a free quote request, not a confirmed booking. There’s no payment required and no obligation to proceed.'],
    ['What about pets or special requests?', 'Please tell us about pets, product sensitivities, access instructions, or areas that need extra attention in the notes field. We’ll discuss what’s possible before your clean.'],
  ].map(([q,a]) => <details key={q}><summary><span>{q}</span><Plus className="faq-toggle" size={20} aria-hidden="true" /></summary><p>{a}</p></details>)}</div></section>
}
export function Footer() {
 return <footer className="site-footer"><div className="container footer-top"><a href="/" className="footer-brand" aria-label="Kiya Clean Co. home">Kiya Clean Co.</a><nav aria-label="Footer navigation"><SectionLink href="/#services">Services</SectionLink><SectionLink href="/#quote">Get a quote</SectionLink><a href="/privacy">Privacy</a></nav></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Kiya Clean Co.</span></div></footer>
}

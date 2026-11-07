import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Check, House, ClipboardCheck, KeyRound, CalendarDays } from 'lucide-react'
import { services, faqs } from '@/lib/site'

const icons = [House, ClipboardCheck, KeyRound, CalendarDays]

export function ServiceCards() {
  return (
    <div className="service-grid">
      {services.map((service, index) => {
        const Icon = icons[index]
        return (
          <Link href={`/services/${service.slug}`} className="service-card" key={service.slug}>
            <div className="service-image">
              <Image
                src={service.image}
                alt={[
                  'Sunlit living room with a linen sofa',
                  'Clean kitchen with natural finishes',
                  'Made bed in a bright bedroom',
                  'Living room ready for everyday use',
                ][index]}
                fill
                sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 25vw"
              />
              <span className="service-icon"><Icon size={21} /></span>
            </div>
            <div className="service-copy">
              <h3>{service.name}</h3>
              <p>{service.short}</p>
              <span>View details <ArrowUpRight size={17} /></span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export function FaqSection() {
  return (
    <section className="section shell faq-section" id="faq">
      <div>
        <p className="eyebrow">FAQ</p>
        <h2>Frequently asked questions.</h2>
        <p className="muted">What to know before requesting cleaning.</p>
        <Link href="/contact" className="text-link">Contact us <ArrowUpRight size={17} /></Link>
      </div>
      <div className="faq-list">
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}<span aria-hidden="true">+</span></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function HomeSections() {
  return (
    <>
      <section className="section shell" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CLEANING SERVICES</p>
            <h2>Choose the cleaning you need.</h2>
          </div>
          <Link href="/services" className="text-link">All services <ArrowUpRight size={17} /></Link>
        </div>
        <ServiceCards />
      </section>

      <section className="how-section">
        <div className="shell section">
          <div className="center-heading">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>From request to confirmed service.</h2>
          </div>
          <div className="steps">
            {[
              ['01', 'Describe your home', 'Choose a service, enter your ZIP code, and share what needs cleaning.'],
              ['02', 'Review the quote', 'We confirm the tasks and price before you agree to service.'],
              ['03', 'Confirm the appointment', 'Available dates depend on your location and the requested service. A quote request is not a booking.'],
            ].map(([number, title, description]) => (
              <div key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <div className="center">
            <Link href="/quote" className="button primary">Request a quote <ArrowUpRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section shell difference">
        <div className="difference-image">
          <Image
            src="/images/clean-kitchen.png"
            alt="Clean kitchen with flowers and natural light"
            fill
            sizes="(max-width: 768px) 90vw, 45vw"
          />
        </div>
        <div className="difference-copy">
          <p className="eyebrow">WHAT TO EXPECT</p>
          <h2>Know what is included before service.</h2>
          <p>Each cleaning option has a proposed checklist. We review your priorities, the final scope, and the price before confirming any appointment.</p>
          <p>Include rooms that need extra attention and any product preferences in your request.</p>
          <ul className="check-list">
            {[
              'A service checklist you can review',
              'Space to share room priorities and preferences',
              'Price and availability confirmed before booking',
            ].map(item => <li key={item}><Check size={17} />{item}</li>)}
          </ul>
          <Link href="/about" className="text-link">About Kiya Clean Co. <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <FaqSection />
    </>
  )
}

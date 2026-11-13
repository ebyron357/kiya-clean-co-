import { services } from '@/lib/site'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowUpRight } from 'lucide-react'

export function generateStaticParams() {
  return services.map(service => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = services.find(item => item.slug === slug)
  return { title: service?.name, description: service?.description }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = services.find(item => item.slug === slug)
  if (!service) notFound()

  return (
    <main className="shell section">
      <Link href="/services" className="text-link">← All cleaning services</Link>
      <div className="detail-layout">
        <div className="page-intro">
          <p className="eyebrow">{service.name}</p>
          <h1>{service.short}</h1>
          <p>{service.description}</p>
          <Link className="button primary" href={`/quote?service=${service.slug}`}>
            Request a quote <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="detail-image">
          <Image src={service.image} alt="Clean residential interior" fill sizes="(max-width: 768px) 90vw, 45vw" priority />
        </div>
      </div>
      <section className="content-panel">
        <p className="eyebrow">SERVICE DETAILS</p>
        <h2>Proposed cleaning checklist</h2>
        <ul className="check-list">
          {service.tasks.map(task => <li key={task}><Check size={18} />{task}</li>)}
        </ul>
        <p className="muted">
          This checklist is a starting point. Final tasks, extras, product preferences, and exclusions are confirmed before booking.
        </p>
      </section>
    </main>
  )
}

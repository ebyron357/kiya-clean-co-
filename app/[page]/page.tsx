import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { FaqSection } from '@/components/home-sections'
import { ZipChecker } from '@/components/zip-checker'
import { BusinessDetails } from '@/components/business-details'

const pages = {
  about: {
    title: 'About Kiya Clean Co.',
    label: 'ABOUT KIYA',
    heading: 'Cleaning with clear expectations.',
    copy: 'Kiya Clean Co. handles residential cleaning requests for routine upkeep, deep cleaning, and move-in or move-out needs. Every request begins with the details of your home.',
  },
  'service-areas': {
    title: 'Service Areas',
    label: 'SERVICE AREA',
    heading: 'Check service availability.',
    copy: 'Enter your ZIP code with a quote request. We confirm coverage before accepting an appointment.',
  },
  contact: {
    title: 'Contact & FAQ',
    label: 'CONTACT',
    heading: 'Questions about a cleaning?',
    copy: 'Use our quote request form to tell us about the job. Scope, price, and availability are confirmed before service is scheduled.',
  },
  rewards: {
    title: 'Kiya Rewards',
    label: 'REWARDS',
    heading: 'Kiya Rewards is not active yet.',
    copy: 'The program is not offering points, discounts, or redemptions. Any future benefits will require published terms.',
  },
  'refer-a-friend': {
    title: 'Refer a Friend',
    label: 'REFERRALS',
    heading: 'The referral program is not active.',
    copy: 'No referral links or credits are available. Terms will be published before any program launches.',
  },
  offers: {
    title: 'Seasonal Cleaning',
    label: 'CLEANING OPTIONS',
    heading: 'Need a one-time deep clean?',
    copy: 'Request a quote for a move, seasonal cleaning, or a home that needs extra attention.',
  },
} as const

export function generateStaticParams() {
  return Object.keys(pages).map(page => ({ page }))
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const data = pages[page as keyof typeof pages]
  return { title: data?.title, description: data?.copy }
}

export default async function InformationPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const data = pages[page as keyof typeof pages]
  if (!data) notFound()
  const isInactiveProgram = page === 'rewards' || page === 'refer-a-friend'

  return (
    <main>
      <section className="shell section">
        <div className="page-intro">
          <p className="eyebrow">{data.label}</p>
          <h1>{data.heading}</h1>
          <p>{data.copy}</p>
        </div>
        {page === 'about' ? (
          <div className="detail-layout">
            <div className="detail-image">
              <Image src="/images/clean-home.png" alt="Bright residential living room" fill sizes="(max-width:768px) 90vw,45vw" />
            </div>
            <div className="difference-copy">
              <h2>What to expect.</h2>
              <p>Select a cleaning service and tell us which rooms need attention. We review the requested work, any extras, and the price before scheduling a visit.</p>
              <p>You can also share product preferences and access requirements. Do not send door codes or keys through the online form.</p>
              <Link href="/services" className="text-link">View cleaning services <ArrowUpRight size={17} /></Link>
            </div>
          </div>
        ) : page === 'service-areas' ? (
          <>
            <ZipChecker />
            <div className="content-panel">
              <MapPin aria-hidden="true" />
              <h2>Coverage is confirmed by request.</h2>
              <BusinessDetails />
              <p className="muted">
                Where no approved ZIP list is shown, coverage must be confirmed individually. Submitting the form does not guarantee service in your area.
              </p>
            </div>
          </>
        ) : isInactiveProgram ? (
          <div className="content-panel">
            <h2>Program unavailable</h2>
            <p className="muted">
              No reward points, referral credits, or program enrollment are offered at this time.
              Check back after the program terms and eligibility requirements are published.
            </p>
            <Link href="/services" className="text-link">View cleaning services <ArrowUpRight size={17} /></Link>
          </div>
        ) : (
          <div className="content-panel">
            <h2>{page === 'offers' ? 'Request a cleaning estimate.' : 'Send a cleaning request.'}</h2>
            <p className="muted">
              {page === 'offers'
                ? 'No promotional discounts are currently offered. Your quote will be based on the requested work.'
                : 'Request a quote below, or use the verified contact details when published. No appointment is confirmed by sending a request.'}
            </p>
            {page === 'contact' && <BusinessDetails />}
            <Link href="/quote" className="button primary">Request a quote <ArrowUpRight size={17} /></Link>
          </div>
        )}
      </section>
      {page === 'contact' && <FaqSection />}
    </main>
  )
}

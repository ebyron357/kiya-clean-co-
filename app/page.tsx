import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { HomeSections } from '@/components/home-sections'
import { ZipChecker } from '@/components/zip-checker'

export default function Page() {
  return (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><span /> RESIDENTIAL CLEANING</p>
          <h1>House cleaning,<br /><em>made straightforward.</em></h1>
          <p className="hero-description">
            Standard, deep, move-in, and recurring cleaning.<br />
            Tell us about your home to request a quote.
          </p>
          <div className="hero-actions">
            <Link href="/quote" className="button primary">Request a quote <ArrowUpRight size={18} /></Link>
            <Link href="/services" className="text-link">View services <ArrowUpRight size={16} /></Link>
          </div>
          <div className="hero-reassurance">
            No payment or account is required to request a quote.
          </div>
        </div>
        <div className="hero-photo">
          <Image
            src="/images/clean-home.png"
            alt="Bright living room with a sofa, oak table, and natural light"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
          />
        </div>
      </section>
      <div className="shell"><ZipChecker /></div>
      <HomeSections />
    </main>
  )
}

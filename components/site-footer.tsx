import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'

export function SiteFooter() {
  return (
    <>
      <section className="closing-cta">
        <div className="shell">
          <p className="eyebrow">REQUEST AN ESTIMATE</p>
          <h2>Tell us what needs cleaning.</h2>
          <Link href="/quote" className="button light">Request a quote <ArrowUpRight size={17} /></Link>
          <p>A quote request does not reserve a visit or authorize a charge.</p>
        </div>
      </section>
      <footer className="shell footer">
        <div className="footer-top">
          <div>
            <Link href="/" className="wordmark" aria-label="Kiya Clean Co. home">
              kiya<Sparkles className="wordmark-star" size={22} aria-hidden="true" />
              <small>CLEAN CO.</small>
            </Link>
            <p>Residential cleaning. Scope and pricing confirmed before scheduling.</p>
          </div>
          <div>
            <h3>Cleaning services</h3>
            <Link href="/services">View all services</Link>
            <Link href="/about">About Kiya</Link>
            <Link href="/service-areas">Service areas</Link>
          </div>
          <div>
            <h3>Get started</h3>
            <Link href="/quote">Request a quote</Link>
            <Link href="/account">My account</Link>
            <Link href="/contact">Contact & FAQ</Link>
          </div>
          <div>
            <h3>Policies</h3>
            <Link href="/policies/cancellation">Cancellation information</Link>
            <Link href="/policies/privacy">Privacy notice</Link>
            <Link href="/policies/terms">Service terms</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Kiya Clean Co. All rights reserved.</p>
          <div>
            <Link href="/policies/privacy">Privacy</Link>
            <Link href="/policies/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  )
}

'use client'

import { useState } from 'react'
import { SectionLink } from './section-link'

export function Brand() { return <span className="brand">Kiya Clean Co.</span> }
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="container header-inner">
      <a href="/" aria-label="Kiya Clean Co. home"><Brand /></a>
      <nav className="desktop-nav" aria-label="Main navigation"><SectionLink href="/#services">Our services</SectionLink><SectionLink href="/#faq">Common questions</SectionLink><SectionLink href="/#how-it-works">How it works</SectionLink></nav>
      <div className="header-actions"><SectionLink className="button button-primary header-quote" href="/#quote">Get a quote</SectionLink><button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button></div>
    </div>
    {open && <nav className="mobile-nav container" id="mobile-nav" aria-label="Mobile navigation">{[['Our services','/#services'],['How it works','/#how-it-works'],['Common questions','/#faq']].map(([label, href]) => <SectionLink key={href} href={href} onClick={() => setOpen(false)}>{label}</SectionLink>)}</nav>}
  </header>
}

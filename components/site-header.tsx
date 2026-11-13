'use client'

import { useState } from 'react'

export function Brand() { return <span className="brand">Kiya Clean Co.</span> }
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="container header-inner">
      <a href="/" aria-label="Kiya Clean Co. home"><Brand /></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="/#services">Our services</a><a href="/#faq">Common questions</a><a href="/#how-it-works">How it works</a></nav>
      <div className="header-actions"><a className="button button-primary header-quote" href="/#quote">Get a quote</a><button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button></div>
    </div>
    {open && <nav className="mobile-nav container" id="mobile-nav" aria-label="Mobile navigation">{[['Our services','/#services'],['How it works','/#how-it-works'],['Common questions','/#faq']].map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}</nav>}
  </header>
}

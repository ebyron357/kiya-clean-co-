'use client'
import Link from 'next/link'
import { useState } from 'react'
import { KiyaMenu as Menu, KiyaClose as X, KiyaArrow as ArrowUpRight, KiyaArch as UserRound, KiyaChevron as ChevronDown } from '@/components/kiya-mark'
import { usePathname } from 'next/navigation'
import { towns } from '@/lib/towns'
import { pricingConfig } from '@/lib/booking-prices'
export function SiteHeader(){
 const [open,setOpen]=useState(false)
 const path=usePathname()
 const services=Object.values(pricingConfig.services).map(s=>({name:s.name,href:`/${s.slug}`}))
 const areas=towns.map(t=>({name:t.name,href:`/${t.slug}`}))
 const link=(name:string,href:string)=><Link key={href} href={href} aria-current={path===href?'page':undefined} onClick={()=>setOpen(false)}>{name}</Link>
 const dropdown=(name:string,items:{name:string;href:string}[])=><details className="area-menu"><summary>{name}<ChevronDown size={16} aria-hidden="true"/></summary><div>{items.map(item=><Link key={item.href} href={item.href} aria-current={path===item.href?'page':undefined} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setOpen(false)}}>{item.name}</Link>)}</div></details>
 return <><div className="announcement" role="region" aria-label="Service area announcement"><span className="announcement-desktop">Cared for by Kiya · Midland · Locust · Concord · Mint Hill · Charlotte</span><span className="announcement-mobile">Cared for by Kiya · Cabarrus · Stanly · Mecklenburg</span></div><header className="site-header"><div className="shell nav-row"><Link className="wordmark" href="/" aria-label="Kiya Clean Co. home" onClick={()=>setOpen(false)}>kiya<small>CLEAN CO.</small></Link><nav aria-label="Main navigation" className="desktop-nav">{dropdown('Services',services)}{link('Pricing','/pricing')}{link('Kiya Circle','/kiya-circle')}{dropdown('Service Areas',areas)}{link('About','/about')}{link('Realtors','/realtors')}</nav><div className="nav-actions"><a className="header-phone" href="tel:+17045550123">(704) 555-0123</a><Link href="/account" className="account-link" aria-label="My account"><UserRound size={20} aria-hidden="true"/></Link><Link href="/book" className="button primary desktop-quote">Get a quote <ArrowUpRight size={16} aria-hidden="true"/></Link><button className="menu-button" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)}>{open?<X aria-hidden="true"/>:<Menu aria-hidden="true"/>}</button></div></div>{open&&<nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav">{dropdown('Services',services)}{link('Pricing','/pricing')}{link('Kiya Circle','/kiya-circle')}{dropdown('Service Areas',areas)}{link('About','/about')}{link('Realtors','/realtors')}{link('My account','/account')}{link('Contact','/contact')}<Link className="button primary" href="/book" onClick={()=>setOpen(false)}>Get a quote <ArrowUpRight/></Link></nav>}</header></>
}

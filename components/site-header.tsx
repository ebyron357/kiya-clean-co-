'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, ArrowUpRight, Sparkles, UserRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
export function SiteHeader() {
 const [open, setOpen] = useState(false)
 const path = usePathname()
 const menuButton = useRef<HTMLButtonElement>(null)
 useEffect(() => {
  if(!open) return
  function closeWithEscape(event: KeyboardEvent) {
   if(event.key === 'Escape') { setOpen(false); menuButton.current?.focus() }
  }
  document.addEventListener('keydown', closeWithEscape)
  return () => document.removeEventListener('keydown', closeWithEscape)
 }, [open])
 const links = [['Services','/services'],['Our difference','/about'],['Rewards','/rewards'],['Service areas','/service-areas']]
 return <><div className="announcement">A little more clean. A lot more living. <Sparkles size={13} aria-hidden="true" /></div><header className="site-header"><div className="shell nav-row"><Link className="wordmark" href="/" aria-label="Kiya Clean Co. home" onClick={()=>setOpen(false)}>kiya<Sparkles className="wordmark-star" size={22} aria-hidden="true"/><small>CLEAN CO.</small></Link><nav aria-label="Main navigation" className="desktop-nav">{links.map(([label,href])=><Link key={href} href={href} aria-current={path===href?'page':undefined}>{label}</Link>)}</nav><div className="nav-actions"><Link href="/account" className="account-link" aria-label="My account"><UserRound size={17}/><span>My account</span></Link><Link href="/quote" className="button primary desktop-quote">Get a quote <ArrowUpRight size={16}/></Link><button ref={menuButton} className="menu-button" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div>{open&&<nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav">{[...links,['My account','/account'],['Contact & FAQ','/contact']].map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}<ArrowUpRight size={16}/></Link>)}</nav>}</header>{!['/quote','/auth','/account','/admin'].some(prefix=>path.startsWith(prefix))&&<div className="mobile-booking"><span>A cleaner home starts here.</span><Link href="/quote" className="button primary">Get a quote <ArrowUpRight size={16}/></Link></div>}</>
}

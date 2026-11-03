'use client'
import Link from 'next/link'
import { useEffect,useRef,useState } from 'react'
import { usePathname } from 'next/navigation'
import { KiyaArrow } from './kiya-mark'
export function MobileBookingBar(){
 const pathname=usePathname(),[shown,setShown]=useState(false);const bar=useRef<HTMLDivElement>(null)
 const allowed=!/^\/(book|quote|account|admin|auth)(\/|$)/.test(pathname)
 useEffect(()=>{
  setShown(false);if(!allowed)return
  const hero=document.querySelector('main .hero, main .page-intro');if(!hero)return
  let last=window.scrollY,passed=false,frame=0
  const update=()=>{frame=0;const y=window.scrollY;const past=hero.getBoundingClientRect().bottom<0;const delta=y-last;if(!past)setShown(false);else if(!passed||delta < -8)setShown(true);else if(delta>8&&!bar.current?.contains(document.activeElement))setShown(false);if(Math.abs(delta)>8)last=y;passed=past}
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)}
  window.addEventListener('scroll',scroll,{passive:true})
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll)}
 },[pathname,allowed])
 if(!allowed)return null
 return <div ref={bar} role="complementary" aria-label="Book your clean" className="mobile-booking" data-shown={shown} inert={!shown} aria-hidden={!shown}><span>Your fresh start awaits.</span><Link href="/book" className="button primary">Book your clean<KiyaArrow size={18}/></Link></div>
}

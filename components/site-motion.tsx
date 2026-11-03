'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
export function SiteMotion(){
 const pathname=usePathname()
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)')
  if(media.matches||!('IntersectionObserver' in window))return
  const elements=[...document.querySelectorAll<HTMLElement>('main .eyebrow, main .editorial-arch, main .detail-image, main .difference-image')].filter(el=>!el.closest('.hero')&&el.getBoundingClientRect().top>window.innerHeight)
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){(entry.target as HTMLElement).dataset.reveal='visible';observer.unobserve(entry.target)}},{threshold:.08})
  elements.forEach(el=>{el.dataset.reveal='pending';observer.observe(el)})
  const finish=()=>{observer.disconnect();elements.forEach(el=>{el.dataset.reveal='visible'})}
  media.addEventListener('change',finish)
  return()=>{finish();media.removeEventListener('change',finish)}
 },[pathname])
 return null
}

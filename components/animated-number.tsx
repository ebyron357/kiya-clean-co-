'use client'
import { useEffect,useRef } from 'react'
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})
export function AnimatedNumber({value,currency=false,from,inView=false}:{value:number;currency?:boolean;from?:number;inView?:boolean}){
 const root=useRef<HTMLSpanElement>(null),visual=useRef<HTMLSpanElement>(null),previous=useRef(value),initial=useRef(value),played=useRef(false)
 const format=(n:number)=>currency?money.format(n/100):String(Math.round(n))
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');let frame=0;let observer:IntersectionObserver|undefined
  const text=(n:number)=>currency?money.format(n/100):String(Math.round(n))
  const finish=()=>{cancelAnimationFrame(frame);if(visual.current)visual.current.textContent=text(value);previous.current=value;observer?.disconnect()}
  const run=()=>{
   const start=from!==undefined&&!played.current?from:previous.current
   if(media.matches||(inView&&played.current)||start===value){played.current=true;finish();return}
   played.current=true;const began=performance.now()
   const tick=(now:number)=>{const progress=Math.max(0,Math.min(1,(now-began)/600));const n=start+(value-start)*(1-Math.pow(1-progress,4));if(visual.current)visual.current.textContent=text(n);previous.current=n;if(progress<1)frame=requestAnimationFrame(tick);else finish()}
   frame=requestAnimationFrame(tick)
  }
  if(inView&&!played.current&&!media.matches&&root.current&&'IntersectionObserver' in window){observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){observer?.disconnect();run()}},{threshold:.5});observer.observe(root.current)}else run()
  media.addEventListener('change',finish)
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();media.removeEventListener('change',finish)}
 },[value,currency,from,inView])
 return <span ref={root} className="animated-number"><span className="number-reserve" aria-hidden="true">{format(value)}</span><span ref={visual} className="number-visual" aria-hidden="true">{format(initial.current)}</span><span className="sr-only">{format(value)}</span></span>
}

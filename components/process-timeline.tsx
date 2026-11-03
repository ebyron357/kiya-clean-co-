'use client'
import { useEffect, useRef } from 'react'
import styles from './home-trust.module.css'
export function ProcessTimeline({steps}:{steps:string[]}){
 const ref=useRef<HTMLOListElement>(null)
 useEffect(()=>{const element=ref.current;if(!element||!('IntersectionObserver' in window))return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){element.dataset.visible='true';observer.disconnect()}},{threshold:.15});observer.observe(element);return()=>observer.disconnect()},[])
 return <ol ref={ref} className={`${styles.steps} process-timeline`}>{steps.map((s,i)=><li key={s}><span className={styles.number} aria-hidden="true">{String(i+1).padStart(2,'0')}</span><p>{s}</p></li>)}</ol>
}

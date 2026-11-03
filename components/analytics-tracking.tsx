'use client'
import Script from 'next/script'
import { useEffect,useState } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'
export function AnalyticsTracking({id}:{id?:string}){
 const pathname=usePathname();const [ready,setReady]=useState(false)
 const isPublic=!/^\/(auth|account|admin|api)(\/|$)/.test(pathname)
 useEffect(()=>{if(!ready||!isPublic)return;window.gtag?.('event','page_view',{page_location:`${window.location.origin}${pathname}`,page_path:pathname,page_title:document.title})},[pathname,ready,isPublic])
 useEffect(()=>{if(!ready||!isPublic)return;function click(event:MouseEvent){const target=event.target instanceof Element?event.target.closest('a'):null;const href=target?.getAttribute('href')||'';if(href.startsWith('tel:'))trackEvent('call_click');else if(href.startsWith('sms:'))trackEvent('text_click')}document.addEventListener('click',click);return()=>document.removeEventListener('click',click)},[ready,isPublic])
 if(!id||!/^G-[A-Z0-9]+$/.test(id)||!isPublic)return null
 return <Script id="kiya-ga" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" onReady={()=>{window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});setReady(true)}}/>
}

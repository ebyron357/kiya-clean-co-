'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight } from 'lucide-react'
export function ZipChecker(){const [zip,setZip]=useState('');const router=useRouter();return <form className="zip-checker" onSubmit={e=>{e.preventDefault();router.push(`/quote?zip=${encodeURIComponent(zip)}`)}}><label htmlFor="home-zip"><MapPin size={18}/><span>Request cleaning in your area.</span></label><div className="zip-input-row"><input id="home-zip" aria-label="Your five-digit ZIP code" placeholder="Enter your ZIP code" inputMode="numeric" autoComplete="postal-code" required pattern="[0-9]{5}" maxLength={5} value={zip} onChange={e=>setZip(e.target.value)}/><button className="button primary" type="submit">Continue to quote <ArrowRight size={17}/></button></div><small>Entering a ZIP starts a quote request. Coverage is confirmed separately.</small></form>}

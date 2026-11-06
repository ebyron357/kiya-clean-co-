'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight } from 'lucide-react'
export function ZipChecker(){const [zip,setZip]=useState('');const router=useRouter();return <form className="zip-checker" onSubmit={e=>{e.preventDefault();router.push(`/quote?zip=${encodeURIComponent(zip)}`)}}><label htmlFor="home-zip"><MapPin size={18}/><span>A fresh start, closer than you think.</span></label><div className="zip-input-row"><input id="home-zip" aria-label="Your five-digit ZIP code" placeholder="Enter your ZIP code" inputMode="numeric" autoComplete="postal-code" required pattern="[0-9]{5}" maxLength={5} value={zip} onChange={e=>setZip(e.target.value)}/><button className="button primary" type="submit">Check my area <ArrowRight size={17}/></button></div><small>We’ll confirm coverage before your cleaning.</small></form>}

import { ServiceCards } from '@/components/home-sections'
import type { Metadata } from 'next'
export const metadata:Metadata={title:'Cleaning Services',description:'Standard, deep, recurring, and move-out cleaning in the Charlotte area.',alternates:{canonical:'/services'}}
export default function Services(){return <main className="shell section"><div className="page-intro"><p className="eyebrow">THOUGHTFUL CARE, ROOM BY ROOM</p><h1>A clean that fits<br/><em>the way you live.</em></h1><p>From everyday upkeep to a fresh beginning, find the right kind of care for your home.</p></div><ServiceCards/><p className="service-note">Every home is different. Final scope, coverage, and pricing are confirmed with you before service.</p></main>}

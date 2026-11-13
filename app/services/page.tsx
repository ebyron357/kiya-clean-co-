import { ServiceCards } from '@/components/home-sections'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cleaning Services' }

export default function Services() {
  return (
    <main className="shell section">
      <div className="page-intro">
        <p className="eyebrow">CLEANING SERVICES</p>
        <h1>Services for your home.</h1>
        <p>Choose standard, deep, move-in/move-out, or recurring cleaning. Request a quote to confirm the work and price.</p>
      </div>
      <ServiceCards />
      <p className="service-note">Final tasks, service area, price, and availability are confirmed before booking.</p>
    </main>
  )
}

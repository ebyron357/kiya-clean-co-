import type { Metadata, Viewport } from 'next'
import { DM_Sans, Cormorant_Garamond } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnalyticsTracking } from '@/components/analytics-tracking'
import { SiteMotion } from '@/components/site-motion'
import { MobileBookingBar } from '@/components/mobile-booking-bar'
import './globals.css'
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500','600'], style: ['normal','italic'], variable: '--font-display' })

export const metadata: Metadata = {
  metadataBase: new URL('https://kiyacleaning.com'),
  title: { default: 'Kiya Clean Co. | A Higher Standard of Clean', template: '%s | Kiya Clean Co.' },
  description: 'Thoughtful residential cleaning for more comfort, more free time, and more reasons to love coming home. Explore services and request your personalized quote.',
  openGraph:{type:'website',siteName:'Kiya Clean Co.',locale:'en_US',images:[{url:'/share-image',width:1200,height:630,alt:'Kiya Clean Co. — Cared for by Kiya · Midland to Charlotte'}]},
  twitter:{card:'summary_large_image',images:['/share-image']},
  verification:{google:process.env.NEXT_PUBLIC_GSC_VERIFICATION||undefined},
  manifest: '/manifest.webmanifest',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/kiya-monogram.png', type: 'image/png', sizes: '1024x1024' }],
    apple: '/kiya-monogram.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1,
  colorScheme: 'light', themeColor: '#4A2257',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light bg-background ${sans.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">
        <a href="#page-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        <div id="page-content">{children}</div>
        <SiteFooter />
        <SiteMotion />
        <MobileBookingBar />
        <AnalyticsTracking id={process.env.NEXT_PUBLIC_GA_ID}/>

        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'LocalBusiness',name:'Kiya Clean Co.',url:'https://kiyacleaning.com',telephone:'+1-704-555-0123',email:'hello@kiyacleaning.com',areaServed:['Midland NC','Locust NC','Concord NC','Mint Hill NC','Charlotte NC'],priceRange:'$$',openingHours:['Mo-Fr 08:00-18:00','Sa 09:00-14:00']})}}/>
      </body>
    </html>
  )
}

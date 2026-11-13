import type { Metadata, Viewport } from 'next'
import { DM_Sans, Cormorant_Garamond } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'
import { SiteAnalytics } from '@/components/site-analytics'
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-display' })

export const metadata: Metadata = {
  title: { default: 'Kiya Clean Co. | Residential Cleaning', template: '%s | Kiya Clean Co.' },
  description: 'Request a residential cleaning quote for standard, deep, move-in, move-out, or recurring cleaning. Coverage, scope, and pricing are confirmed before booking.',
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false }, // Keep unlaunched development previews out of search results.
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1,
  colorScheme: 'light', themeColor: '#4B205B',
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
        <SiteAnalytics />
      </body>
    </html>
  )
}

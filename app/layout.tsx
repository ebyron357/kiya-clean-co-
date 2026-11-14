import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { homeDescription, homeTitle, indexingMetadata, pageMetadata, siteName, siteOrigin } from '@/lib/site-metadata'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
export const metadata: Metadata = {
  ...pageMetadata(homeTitle, homeDescription, '/'),
  metadataBase: new URL(siteOrigin),
  robots: indexingMetadata(process.env.VERCEL_ENV),
  applicationName: siteName,
  manifest: '/manifest.webmanifest',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#fffdfa' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`bg-background ${manrope.variable}`}><body className="font-sans text-foreground">{children}</body></html>
}

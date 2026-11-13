import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
export const metadata: Metadata = {
  title: 'Kiya Clean Co. | A fresh home. A little more life.',
  description: 'Thoughtful home cleaning for your everyday. Explore standard, deep, and move-in or move-out cleaning and request your free, personalized quote from Kiya Clean Co.',
  applicationName: 'Kiya Clean Co.',
  manifest: '/manifest.webmanifest',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#194c3b' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`bg-background ${manrope.variable}`}><body className="font-sans text-foreground">{children}</body></html>
}

import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
export const metadata: Metadata = {
  title: 'Kiya Clean Co. | Home Cleaning',
  description: 'Standard, deep, and move-in or move-out home cleaning from Kiya Clean Co. View services and request a free quote.',
  applicationName: 'Kiya Clean Co.',
  manifest: '/manifest.webmanifest',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#fffdfa' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`bg-background ${manrope.variable}`}><body className="font-sans text-foreground">{children}</body></html>
}

import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/home-sections'
import { pageMetadata } from '@/lib/site-metadata'
export const metadata: Metadata = pageMetadata(
  'Quote Request Privacy | Kiya Clean Co.',
  'Learn what Kiya Clean Co. collects when you request a quote, how your details are used and stored, and how to request a correction or deletion.',
  '/privacy',
)
export default function PrivacyPage() {
 return <><SiteHeader/><main className="container section privacy-page"><h1>Quote request privacy</h1><p>Updated November 12, 2026</p><h2>What we collect</h2><p>When you request a quote, Kiya Clean Co. collects your name, email, optional phone number, ZIP code, cleaning preferences, and any notes you choose to provide. Please do not include payment information, entry codes, or other sensitive details.</p><h2>How we use it</h2><p>We use your information to review your request, confirm service coverage, discuss cleaning needs, and contact you about your quote. Submitting this form does not enroll you in marketing messages or confirm a booking.</p><h2>Storage and access</h2><p>Requests are stored in our Supabase database. Public website visitors cannot read submitted requests. Authorized operators and our hosting and database providers may process the information to operate this service. We also use hashed network and email identifiers for abuse prevention.</p><h2>Your choices</h2><p>You may leave optional fields blank. To request a correction or deletion, reply to the team when they contact you about your quote, or submit another request with “Privacy request” in the notes. We may need to verify your identity before acting.</p><h2>Cookies and tracking</h2><p>This quote form does not use advertising cookies or store your request in your browser. Essential hosting and security services may process technical request information.</p><a className="button button-primary" href="/#quote">Back to your quote</a></main><Footer/></>
}

import Link from 'next/link'
import { dollars, pricingConfig } from '@/lib/booking-prices'
export const metadata = { title: 'Cleaning Policies', description: 'Plain-English cancellation, re-clean, walkthrough, pet, access, weather, and holiday policies from Kiya Clean Co.', alternates: { canonical: '/policies' } }
export default function Policies() {
  const p = pricingConfig.policies
  const sections = [
    ['Plans change. Give us a little notice.', `Reschedule or cancel at least ${p.changeNoticeHours} hours before your arrival window begins. Rescheduling depends on an open slot and confirmation. A cancellation inside ${p.changeNoticeHours} hours carries a ${dollars(p.lateCancelFeeCents)} fee once payment terms have been agreed. Until account changes are enabled, email Client Care; a request is not a confirmed change.`],
    ['A missed spot? We’ll make it right.', `Tell us within ${p.recleanNoticeHours} hours of completion about something missed in your agreed scope and we will arrange a free re-clean. Our move-in / move-out Walkthrough Guarantee gives you ${p.walkthroughNoticeHours} hours to report cleaning items flagged in your walkthrough. We re-clean those items, but cannot guarantee a landlord’s inspection decision or deposit return.`],
    ['A comfortable visit for your pets, too.', 'Let us know about your pets before the visit. Please keep them in a safe, comfortable place away from our team while we work, and share any sensitivities or safety concerns.'],
    ['Keys, lockboxes, and getting inside.', `You do not need to be home. Arrange secure access directly with Client Care, and never put door or lockbox codes in general forms. If the team cannot get in at the agreed time, the lockout fee is ${dollars(p.lockoutFeeCents)} once payment terms have been agreed.`],
    ['Weather days.', 'When severe weather makes a visit unsafe, we will contact you to find a new time. A weather cancellation initiated by Kiya does not incur a customer late-cancellation fee. Please tell us if your property has unsafe access.'],
    ['Holidays and time away.', `Holiday schedules may differ; we will coordinate any changes with you. Plans may be paused for up to ${p.maximumPauseWeeks} weeks through Client Care until self-service is available. Please confirm your pause and return date; the minimum commitment still applies.`],
  ]
  return <main className="shell section legal-copy"><header className="page-intro"><p className="eyebrow">CLEAR EXPECTATIONS</p><h1>Care you can count on.</h1><p>The everyday details, in plain English.</p></header>{sections.map(([title,text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}<nav className="town-links" aria-label="Full policies"><Link href="/terms">Read the full Terms of Service</Link><Link href="/privacy">Your privacy</Link><Link href="/contact">Contact Client Care</Link></nav></main>
}

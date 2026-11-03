import Link from 'next/link'
import { KiyaArrow as ArrowUpRight } from '@/components/kiya-mark'
import styles from './home-trust.module.css'
import { pricingConfig,dollars,circleValueCents } from '@/lib/booking-prices'
import { brandConfig } from '@/lib/brand-config'
import { StandardChecklist } from './standard-checklist'
import { ProcessTimeline } from './process-timeline'
export const homepageFaqs=[
 ['How much does house cleaning cost?',`A biweekly standard clean for a 3-bedroom home is ${dollars(pricingConfig.services.standard.rates[1])}. Deep cleans start at ${dollars(pricingConfig.services.deep.rates[0])}.`],
 ['What areas do you serve?','Midland, Locust, Concord, Mint Hill, and Charlotte, NC.'],
 ['Do I need to be home?','No. Many clients share a lockbox or door code with our Client Care team.'],
 ['Do you bring supplies?','Yes. We bring all supplies and equipment.'],
 ['Do you clean homes with pets?','Yes. Let us know about your pets when you book.'],
 ['What if something is missed?','Tell us within 24 hours and we come back and re-clean it free.'],
 ['Can I keep the same team?','Yes. You get your dedicated Kiya team every visit.'],
 ['What is the Kiya Circle?',`Our biweekly membership: ${dollars(circleValueCents)} in free add-ons on your first deep clean, a ${pricingConfig.circle.rateLockMonths}-month rate lock, priority booking, and a free add-on every month. Limited to ${pricingConfig.circle.capacity} members.`],
]
const steps=['Get your price in 60 seconds.','Pick an open time that fits your life.','Your dedicated Kiya team cleans to the Kiya 50-Point Standard.','Walk in to the Kiya Turndown: your home, ready.']
export function HowWeClean(){return <section className={`shell section ${styles.process}`} aria-labelledby="how-heading"><div><p className="eyebrow">HOW WE CLEAN</p><h2 id="how-heading">Your fresh start.<br/><em>Our thoughtful process.</em></h2></div><ProcessTimeline steps={steps}/><p className={styles.note}>Explore our <Link href="/pricing">flat-rate prices</Link> today. Choose a live arrival window when you book. Your appointment stays pending until payment is completed.</p></section>}
export function KiyaStandard(){return <section className={styles.standard} aria-labelledby="standard-heading"><div className="shell section standard-teaser"><p className="eyebrow">THE KIYA STANDARD</p><h2 id="standard-heading">Cared for <em>by Kiya.</em></h2><p>{brandConfig.story}</p><StandardChecklist/><Link href="/the-kiya-standard" className="text-link">Explore the Kiya 50-Point Standard <ArrowUpRight size={18} aria-hidden="true"/></Link></div></section>}
export { LiveTrustBadges as TrustBadges } from './live-trust'
export { LiveReviews as CustomerReviews } from './live-trust'
export function HomepageFaqSchema(){return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:homepageFaqs.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))}).replace(/</g,'\\u003c')}}/>}

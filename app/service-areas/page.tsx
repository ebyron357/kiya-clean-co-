import Link from 'next/link'
import { towns } from '@/lib/towns'
import { ZipChecker } from '@/components/zip-checker'
export const metadata={title:'Our Service Areas',description:'House cleaning in Midland, Locust, Concord, Mint Hill, and Charlotte, NC.',alternates:{canonical:'/service-areas'}}
export default function Areas(){return <main className="shell section"><div className="page-intro"><p className="eyebrow">CLOSE TO HOME</p><h1>Your neighborhood.<br/>Our kind of care.</h1><p>Serving Midland, Locust, Concord, Mint Hill, and Charlotte. Check your ZIP to get started; addresses near city boundaries are confirmed by Client Care.</p></div><ZipChecker/><nav className="town-links" aria-label="Town cleaning guides">{towns.map(t=><Link key={t.slug} href={`/${t.slug}`}>House cleaning in {t.name}</Link>)}</nav></main>}

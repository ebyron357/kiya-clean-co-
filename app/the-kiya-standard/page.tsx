import Link from 'next/link'
import { KiyaArrow } from '@/components/kiya-mark'
import { StandardChecklist } from '@/components/standard-checklist'
import { brandConfig } from '@/lib/brand-config'
export const metadata={title:'The Kiya 50-Point Standard',description:'Our complete room-by-room checklist. Fifty thoughtful details, finished with the Kiya Turndown.',alternates:{canonical:'/the-kiya-standard'}}
export default function Page(){return <main className="shell section service-detail"><header className="page-intro"><p className="eyebrow">CARED FOR BY KIYA</p><h1>The Kiya<br/>50-Point Standard.</h1><p>{brandConfig.story}</p></header><StandardChecklist/><div><Link href="/book" className="button primary">Get my exact price <KiyaArrow/></Link></div></main>}

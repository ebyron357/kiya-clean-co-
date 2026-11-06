import { services } from '@/lib/site'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowUpRight } from 'lucide-react'
export function generateStaticParams(){return services.map(s=>({slug:s.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const s=services.find(s=>s.slug===slug);return {title:s?.name,description:s?.description}}
export default async function ServicePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const s=services.find(s=>s.slug===slug);if(!s)notFound();return <main className="shell section"><Link href="/services" className="text-link">← All cleaning services</Link><div className="detail-layout"><div className="page-intro"><p className="eyebrow">{s.name}</p><h1>{s.short}</h1><p>{s.description}</p><Link className="button primary" href={`/quote?service=${s.slug}`}>Request my clean <ArrowUpRight size={17}/></Link></div><div className="detail-image"><Image src={s.image} alt={`A fresh home ready for ${s.name.toLowerCase()}`} fill sizes="(max-width: 768px) 90vw, 45vw" priority/></div></div><section className="content-panel"><p className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</p><h2>Your cleaning checklist</h2><ul className="check-list">{s.tasks.map(t=><li key={t}><Check size={18}/>{t}</li>)}</ul><p className="muted">This is our proposed service scope. We’ll confirm your final checklist, extras, product preferences, and any exclusions before accepting a booking.</p></section></main>}

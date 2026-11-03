import Link from 'next/link'
import { towns } from '@/lib/towns'
export const townCounties:Record<string,string>={Midland:'Cabarrus County',Locust:'Stanly & Cabarrus Counties',Concord:'Cabarrus County','Mint Hill':'Mecklenburg & Union Counties',Charlotte:'Mecklenburg County'}
export function TownRoute({current}:{current:string}){
 return <nav className="town-route" aria-label="Service towns — schematic, not to scale"><ol>{towns.map(t=><li key={t.slug}><Link href={`/${t.slug}`} aria-current={current===t.name?'page':undefined}><span className="town-stop" aria-hidden="true"/>{t.name}</Link></li>)}</ol></nav>
}

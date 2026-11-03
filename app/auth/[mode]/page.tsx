import { AuthForm } from '@/components/auth-form'
import { notFound } from 'next/navigation'
export const metadata={title:'Your Kiya Account',robots:{index:false,follow:false}}
export default async function AuthPage({params}:{params:Promise<{mode:string}>}){const {mode}=await params;if(!['login','signup'].includes(mode))notFound();return <main className="shell section"><div className="auth-box"><div className="page-intro"><p className="eyebrow">A LITTLE PLACE OF YOUR OWN</p><h1>{mode==='signup'?'Make yourself at home.':'Welcome home.'}</h1><p>{mode==='signup'?'Keep your quote requests and cleaning preferences in one thoughtful place.':'Your requests, your preferences, your little corner of Kiya.'}</p></div><AuthForm signup={mode==='signup'}/></div></main>}

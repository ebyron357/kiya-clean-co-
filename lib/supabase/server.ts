import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient(){const jar=await cookies();return createServerClient((process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL)!,(process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,{cookieOptions:{secure:process.env.NODE_ENV==='production'},cookies:{getAll:()=>jar.getAll(),setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options))}catch{/* Server components cannot write cookies; proxy refreshes them. */}}}})}

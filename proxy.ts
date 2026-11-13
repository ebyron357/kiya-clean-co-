import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function proxy(request:NextRequest){let response=NextResponse.next({request});const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}});await client.auth.getUser();return response}
// Quote API validates before creating its own cookie-aware auth client. Running
// session refresh first would make even invalid public requests depend on auth.
export const config={matcher:['/account/:path*','/admin/:path*','/auth/:path*']}

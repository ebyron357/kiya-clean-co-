'use server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
export async function authenticate(_previous:{message:string},form:FormData):Promise<{message:string}>{
 const parsed=z.object({email:z.email().max(254),password:z.string().min(8).max(128),mode:z.enum(['login','signup'])}).safeParse(Object.fromEntries(form));if(!parsed.success)return {message:'Enter a valid email and a password with at least 8 characters.'};const {email,password,mode}=parsed.data;const client=await createClient();
 if(mode==='signup'){const h=await headers();const origin=h.get('origin');if(!origin)return {message:'Unable to verify this request. Please reload.'};const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL??`${origin}/auth/callback`}});if(error){if(error.status===429)return {message:'Too many attempts. Please wait before trying again.'};if(error.code==='weak_password')return {message:'Please choose a stronger password.'};return {message:'Sign-up could not be completed. Please try again later or sign in if you already have an account.'}}return {message:'If registration is available for this email, check your inbox to confirm your account before signing in.'}}
 const {error}=await client.auth.signInWithPassword({email,password});if(error){if(error.code==='email_not_confirmed')return {message:'Please confirm your email before signing in.'};if(error.status===429)return {message:'Too many attempts. Please wait before trying again.'};if(error.code==='invalid_credentials')return {message:'Invalid email or password.'};return {message:'Sign-in is temporarily unavailable. Please try again later.'}}redirect('/account')
}
export async function signOut(){const client=await createClient();await client.auth.signOut();redirect('/auth/login')}

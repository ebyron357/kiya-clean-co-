'use server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
export async function withdrawQuote(form:FormData){const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/auth/login');const id=z.uuid().parse(form.get('id'));const {error}=await adminClient().from('kiya_quotes').update({status:'withdrawn'}).eq('id',id).eq('user_id',user.id).eq('status','requested');if(error)throw new Error('Unable to withdraw request. Please retry.');revalidatePath('/account')}
export async function savePreferences(form:FormData){const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/auth/login');const notes=z.string().max(1500).parse(form.get('notes'));const {error}=await db.from('kiya_preferences').upsert({user_id:user.id,preferences:{notes},updated_at:new Date().toISOString()});if(error)throw new Error('Unable to save preferences. Please retry.');revalidatePath('/account')}

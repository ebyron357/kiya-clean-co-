import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { inquirySchema as schema } from '@/lib/inquiry-validation'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');const host=request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()||request.headers.get('host');if(!origin||new URL(origin).host!==host)return NextResponse.json({error:'Request not allowed.'},{status:403})
 const raw=await request.text();if(raw.length>10000)return NextResponse.json({error:'Request too large.'},{status:413})
 const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return NextResponse.json({error:'Check all required fields, email, ZIP, and consent. For applications, include a valid phone and choose at least one available day.'},{status:400})
 const db=adminClient();const bucket=createHash('sha256').update(`inquiry:${request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown'}`).digest('hex');const {data:allowed,error:limitError}=await db.rpc('kiya_check_rate_limit',{bucket,max_hits:8,window_seconds:3600});if(limitError)throw limitError;if(!allowed)return NextResponse.json({error:'Too many requests. Please try later.'},{status:429})
 const {submissionId,kind,email,website,...details}=parsed.data;const auth=await createClient();const {data:{user}}=await auth.auth.getUser();const common={submission_id:submissionId,user_id:user?.id??null,email,zip:details.zip};const table=kind==='waitlist'?'waitlist':kind==='career'?'job_applications':'contact_messages';const row=kind==='waitlist'?common:kind==='career'?{...common,name:details.name,phone:details.phone,details}:{...common,name:details.name,phone:details.phone,message:details.message};const {error}=await db.from(table).insert(row);if(error&&error.code!=='23505')throw error
 return NextResponse.json({success:true})
 }catch{console.error('[kiya] Inquiry save failed');return NextResponse.json({error:'We could not save your request. Please try again.'},{status:503})}}

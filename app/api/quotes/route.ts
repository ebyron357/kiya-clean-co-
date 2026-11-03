import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { quoteSchema } from '@/lib/quote-schema'
import { bookingPrice, isServedZip } from '@/lib/booking-prices'
export async function POST(request:Request){
 const origin=request.headers.get('origin');const publicHost=request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()||request.headers.get('host');
 if(!origin||!publicHost||new URL(origin).host!==publicHost)return NextResponse.json({error:'Request origin not allowed.'},{status:403})
 if(Number(request.headers.get('content-length')||0)>16000)return NextResponse.json({error:'Request is too large.'},{status:413})
 try{const raw=await request.text();if(raw.length>16000)return NextResponse.json({error:'Request is too large.'},{status:413});const parsed=quoteSchema.safeParse(JSON.parse(raw));if(!parsed.success)return NextResponse.json({error:'Please check your request details.'},{status:400});const q=parsed.data;if(!isServedZip(q.zip))return NextResponse.json({error:'Please join the waitlist for your area.'},{status:400});const db=adminClient();const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const bucket=createHash('sha256').update(`quote:${ip}`).digest('hex');const {data:allowed,error:limitError}=await db.rpc('kiya_check_rate_limit',{bucket,max_hits:8,window_seconds:3600});if(limitError)throw limitError;if(!allowed)return NextResponse.json({error:'Too many requests. Please try again later.'},{status:429});const client=await createClient();const {data:{user}}=await client.auth.getUser();const {submissionId,name,email,phone,zip,consent,marketing,website,...details}=q;
 const {error}=await db.from('kiya_quotes').insert({submission_id:submissionId,user_id:user?.id??null,customer_name:name,email,phone,zip,details:{...details,pricing:bookingPrice(details),notificationStatus:'not_configured',foundingEligibility:'pending_review'},marketing_consent:marketing});if(error&&error.code!=='23505')throw error;return NextResponse.json({success:true,message:'Your request has been saved. This is not a confirmed booking.'},{status:201})
 }catch(error){console.error('[kiya] Quote submission failed',error instanceof Error?error.name:'Database or validation error');return NextResponse.json({error:'We could not save your request. Please try again.'},{status:503})}
}

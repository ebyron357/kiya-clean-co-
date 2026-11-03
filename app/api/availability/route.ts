import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
export const dynamic='force-dynamic'
export async function GET(){try{const auth=await createClient();const {data:{user},error:authError}=await auth.auth.getUser();if(authError&&authError.name!=='AuthSessionMissingError')throw authError;const {data,error}=await adminClient().rpc('kiya_open_slots',{p_user_id:user?.id??null});if(error)throw error;return NextResponse.json({slots:data,timeZone:'America/New_York'},{headers:{'Cache-Control':'private, no-store'}})}catch{console.error('[kiya] Availability read failed');return NextResponse.json({error:'Availability is temporarily unavailable. Please retry.'},{status:503})}}

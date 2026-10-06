import type {SupabaseClient} from '@supabase/supabase-js';
import {safeReturnPath} from './return-path';
export async function confirmAuth(client:SupabaseClient|null,params:URLSearchParams):Promise<string>{
 if(!client)return '/login?error=unavailable';
 try{const token=params.get('token_hash'),type=params.get('type'),code=params.get('code');
 if(token&&(type==='email'||type==='signup')){const {error}=await client.auth.verifyOtp({token_hash:token,type});if(!error)return safeReturnPath(params.get('next'));}
 else if(code){const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return safeReturnPath(params.get('next'));}
 }catch{/* Tokens and upstream errors must never enter logs or UI. */}
 return '/login?error=link';
}

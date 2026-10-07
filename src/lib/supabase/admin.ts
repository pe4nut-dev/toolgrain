import 'server-only';
import {createClient} from '@supabase/supabase-js';

export function createSupabaseAdmin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(!url||!key)return null;
 const opaqueSecret=key.startsWith('sb_secret_');
 return createClient(url,key,{
  // Never resolve a signed-in session for privileged billing requests.
  accessToken:async()=>null,
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  global:{fetch:async(input,init)=>{
   const headers=new Headers(init?.headers);
   headers.set('apikey',key);
   // Opaque secret keys belong in apikey, never in Authorization: Bearer.
   // Pin legacy JWT credentials too; never forward an end-user token.
   if(opaqueSecret)headers.delete('authorization');
   else headers.set('authorization',`Bearer ${key}`);
   headers.delete('cookie');
   return fetch(input,{...init,headers,credentials:'omit'});
  }},
 });
}

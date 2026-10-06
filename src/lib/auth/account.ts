import 'server-only';
import {cache} from 'react';
import {createSupabaseServerClient} from '../supabase/server';
import {anonymousAccount,resolveProfilePlan,type AccountSnapshot,type AccountProfile} from './account-data';
export const getAccount=cache(async():Promise<AccountSnapshot>=>{
 try{const client=await createSupabaseServerClient();if(!client)return anonymousAccount;
 const {data,error}=await client.auth.getUser();if(error||!data.user)return anonymousAccount;
 const user={id:data.user.id,email:data.user.email??null};
 const {data:profile,error:profileError}=await client.from('profiles').select('id,email,plan,created_at,updated_at').eq('id',user.id).maybeSingle();
 const trusted=profileError||profile?.id!==user.id?null:profile as AccountProfile|null;
 return {user,profile:trusted,plan:resolveProfilePlan(user.id,trusted),profileAvailable:!!trusted};
 }catch{return anonymousAccount;}
});

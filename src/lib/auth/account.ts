import 'server-only';
import {cache} from 'react';
import {createSupabaseServerClient} from '../supabase/server';
import {anonymousAccount,resolveProfilePlan,type AccountSnapshot,type AccountProfile} from './account-data';
export const getAccount=cache(async():Promise<AccountSnapshot>=>{
 try{const client=await createSupabaseServerClient();if(!client)return anonymousAccount;
 const {data,error}=await client.auth.getUser();if(error||!data.user)return anonymousAccount;
 const user={id:data.user.id,email:data.user.email??null};
 let {data:profile,error:profileError}=await client.from('profiles').select('id,email,plan,created_at,updated_at,stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_price_id,subscription_current_period_end').eq('id',user.id).maybeSingle();
 if(profileError){const fallback=await client.from('profiles').select('id,email,plan,created_at,updated_at').eq('id',user.id).maybeSingle();profile=fallback.data?{...fallback.data,stripe_customer_id:null,stripe_subscription_id:null,stripe_subscription_status:null,stripe_price_id:null,subscription_current_period_end:null}:null;profileError=fallback.error;}
 const trusted=profileError||profile?.id!==user.id?null:profile as AccountProfile|null;
 return {user,profile:trusted,plan:resolveProfilePlan(user.id,trusted),profileAvailable:!!trusted};
 }catch{return anonymousAccount;}
});

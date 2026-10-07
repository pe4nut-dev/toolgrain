import 'server-only';
import {randomUUID} from 'node:crypto';
import {createSupabaseAdmin} from '@/lib/supabase/admin';
import type {AccountProfile} from '@/lib/auth/account-data';
export function billingRepository(){const db=createSupabaseAdmin();if(!db)throw new Error('Billing unavailable');return {
 async profile(id:string){const {data,error}=await db.from('profiles').select('*').eq('id',id).single();if(error||!data)throw new Error('Profile unavailable');return data as AccountProfile;},
 async userForCustomer(customer:string){const {data,error}=await db.from('profiles').select('id').eq('stripe_customer_id',customer).maybeSingle();if(error)throw new Error('Lookup failed');return data?.id as string|undefined;},
 async lock(id:string){const token=randomUUID();const {data,error}=await db.rpc('acquire_billing_lock',{p_user:id,p_token:token});if(error||!data)throw new Error('Billing busy');return token;},
 async release(id:string,token:string){await db.rpc('release_billing_lock',{p_user:id,p_token:token});},
 async link(id:string,token:string,customer:string){const {data,error}=await db.rpc('link_billing_customer',{p_user:id,p_token:token,p_customer:customer});if(error||!data)throw new Error('Customer link failed');},
 async write(id:string,token:string,customer:string,state:{stripe_subscription_id:string|null;stripe_subscription_status:string|null;stripe_price_id:string|null;subscription_current_period_end:string|null;plan:'free'|'pro'}){const {data,error}=await db.rpc('write_billing_state',{p_user:id,p_token:token,p_customer:customer,p_subscription:state.stripe_subscription_id,p_status:state.stripe_subscription_status,p_price:state.stripe_price_id,p_end:state.subscription_current_period_end,p_plan:state.plan});if(error||!data)throw new Error('Billing write failed');}
 };}
export type BillingRepository=ReturnType<typeof billingRepository>;

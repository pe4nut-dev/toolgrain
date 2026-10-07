import {billingFailure,logBillingFailure} from './diagnostics';
import 'server-only';
import {randomUUID} from 'node:crypto';
import {createSupabaseAdmin} from '@/lib/supabase/admin';
import type {AccountProfile} from '@/lib/auth/account-data';
export function billingRepository(){const db=createSupabaseAdmin();if(!db)throw billingFailure('billing.repository.initialize',null);return {
 async profile(id:string){const {data,error,status}=await db.from('profiles').select('*').eq('id',id).single();if(error||!data)throw billingFailure('billing.profile.read',error,'supabase',status);return data as AccountProfile;},
 async userForCustomer(customer:string){const {data,error,status}=await db.from('profiles').select('id').eq('stripe_customer_id',customer).maybeSingle();if(error)throw billingFailure('billing.customer.lookup',error,'supabase',status);return data?.id as string|undefined;},
 async lock(id:string){const token=randomUUID();const {data,error,status}=await db.rpc('acquire_billing_lock',{p_user:id,p_token:token});if(error||!data)throw billingFailure('billing.lock.acquire',error,'supabase',status);return token;},
 async release(id:string,token:string){const {error,status}=await db.rpc('release_billing_lock',{p_user:id,p_token:token});if(error)logBillingFailure(billingFailure('billing.lock.release',error,'supabase',status),'billing.lock.release');},
 async link(id:string,token:string,customer:string){const {data,error,status}=await db.rpc('link_billing_customer',{p_user:id,p_token:token,p_customer:customer});if(error||!data)throw billingFailure('billing.customer.link',error,'supabase',status);},
 async write(id:string,token:string,customer:string,state:{stripe_subscription_id:string|null;stripe_subscription_status:string|null;stripe_price_id:string|null;subscription_current_period_end:string|null;plan:'free'|'pro'}){const {data,error,status}=await db.rpc('write_billing_state',{p_user:id,p_token:token,p_customer:customer,p_subscription:state.stripe_subscription_id,p_status:state.stripe_subscription_status,p_price:state.stripe_price_id,p_end:state.subscription_current_period_end,p_plan:state.plan});if(error||!data)throw billingFailure('billing.state.write',error,'supabase',status);}
 };}
export type BillingRepository=ReturnType<typeof billingRepository>;

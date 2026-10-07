import type {PlanId} from '../../config/plans';
export type AccountProfile={id:string;email:string|null;plan:PlanId;created_at:string;updated_at:string;stripe_customer_id?:string|null;stripe_subscription_id?:string|null;stripe_subscription_status?:string|null;stripe_price_id?:string|null;subscription_current_period_end?:string|null};
export type AccountSnapshot={user:{id:string;email:string|null}|null;profile:AccountProfile|null;plan:PlanId;profileAvailable:boolean};
export const anonymousAccount:AccountSnapshot={user:null,profile:null,plan:'free',profileAvailable:false};
export function resolveProfilePlan(userId:string|null,profile:{id:string;plan:unknown}|null):PlanId{return userId&&profile?.id===userId&&profile.plan==='pro'?'pro':'free';}

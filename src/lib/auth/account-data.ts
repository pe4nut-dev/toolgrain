import type {PlanId} from '../../config/plans';
export type AccountProfile={id:string;email:string|null;plan:PlanId;created_at:string;updated_at:string};
export type AccountSnapshot={user:{id:string;email:string|null}|null;profile:AccountProfile|null;plan:PlanId;profileAvailable:boolean};
export const anonymousAccount:AccountSnapshot={user:null,profile:null,plan:'free',profileAvailable:false};
export function resolveProfilePlan(userId:string|null,profile:{id:string;plan:unknown}|null):PlanId{return userId&&profile?.id===userId&&profile.plan==='pro'?'pro':'free';}

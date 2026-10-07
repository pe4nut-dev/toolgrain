import type Stripe from 'stripe';
import type {PlanId} from '@/config/plans';
export type BillingCycle='monthly'|'annual';
export function parseBillingCycle(value:unknown):BillingCycle|null{return value==='monthly'||value==='annual'?value:null;}
export const entitledStatuses=new Set(['active','trialing','past_due']);
export function subscriptionPlan(status:string,price:string|null,known:readonly string[]):PlanId{return price&&known.includes(price)&&entitledStatuses.has(status)?'pro':'free';}
export function subscriptionSnapshot(subscription:Stripe.Subscription,known:readonly string[]){const item=subscription.items.data[0];const price=subscription.items.data.length===1&&item?.quantity===1?item.price.id:null;const end=item?.current_period_end;return {stripe_subscription_id:subscription.id,stripe_subscription_status:subscription.status,stripe_price_id:price,subscription_current_period_end:end?new Date(end*1000).toISOString():null,plan:subscriptionPlan(subscription.status,price,known)};}
export function selectSubscription(subscriptions:Stripe.Subscription[],known:readonly string[]){return [...subscriptions].sort((a,b)=>Number(subscriptionSnapshot(b,known).plan==='pro')-Number(subscriptionSnapshot(a,known).plan==='pro')||b.created-a.created||a.id.localeCompare(b.id))[0]??null;}
export function blocksNewSubscription(status:string){return !['canceled','incomplete_expired'].includes(status);}

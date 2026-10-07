import {plans} from '@/config/plans';
import type Stripe from 'stripe';
import type {BillingRepository} from './repository';
import {blocksNewSubscription,parseBillingCycle,selectSubscription,subscriptionSnapshot} from './entitlement';
import {siteConfig} from '@/config/site';
export type BillingUser={id:string;email:string|null};
export type BillingResult={url?:string;error?:string};
export async function customerSubscriptions(stripe:Stripe,customer:string){const subscriptions:Stripe.Subscription[]=[];for await(const sub of stripe.subscriptions.list({customer,status:'all',limit:100}))subscriptions.push(sub);return subscriptions;}
export async function startCheckout(stripe:Stripe,repo:BillingRepository,user:BillingUser|null,cycleInput:unknown,prices:{monthly:string;annual:string}):Promise<BillingResult>{
 if(!user)return {url:'/login?next=%2Fpricing'};const cycle=parseBillingCycle(cycleInput);if(!cycle)return {error:'Choose monthly or annual billing.'};
 const token=await repo.lock(user.id);try{const profile=await repo.profile(user.id);let customer=profile.stripe_customer_id;
 if(profile.plan==='pro')return {url:'/account'};
 if(!customer){const created=await stripe.customers.create({...(user.email?{email:user.email}:{}),metadata:{supabase_user_id:user.id}},{idempotencyKey:'toolgrain-customer-'+user.id});customer=created.id;await repo.link(user.id,token,customer);}
 const subscriptions=await customerSubscriptions(stripe,customer);if(subscriptions.some(sub=>blocksNewSubscription(sub.status)))return {url:'/account?billing=pending'};
 const sessions=await stripe.checkout.sessions.list({customer,limit:100});const open=sessions.data.filter(s=>s.mode==='subscription'&&s.status==='open');if(open.length){const old=open[0];if(old.metadata?.billing_cycle===cycle&&old.url)return {url:old.url};for(const session of open)await stripe.checkout.sessions.expire(session.id);}
 const price=await stripe.prices.retrieve(prices[cycle]);if(!price.active||price.currency!=='eur'||price.unit_amount!==Math.round((cycle==='monthly'?plans.pro.monthlyPrice:plans.pro.annualPrice)*100)||price.recurring?.interval!==(cycle==='monthly'?'month':'year')||price.recurring.interval_count!==1)throw new Error('Invalid price configuration');
 const session=await stripe.checkout.sessions.create({mode:'subscription',customer,line_items:[{price:prices[cycle],quantity:1}],client_reference_id:user.id,metadata:{supabase_user_id:user.id,billing_cycle:cycle},subscription_data:{metadata:{supabase_user_id:user.id}},success_url:siteConfig.url+'/account?checkout=success',cancel_url:siteConfig.url+'/pricing?checkout=cancelled',allow_promotion_codes:false},{idempotencyKey:'toolgrain-checkout-'+user.id+'-'+cycle+'-'+token});if(!session.url)throw new Error('Checkout unavailable');return {url:session.url};
 }finally{await repo.release(user.id,token);}
}
export async function startPortal(stripe:Stripe,repo:BillingRepository,user:BillingUser|null):Promise<BillingResult>{if(!user)return {url:'/login?next=%2Faccount'};const profile=await repo.profile(user.id);if(!profile.stripe_customer_id)return {error:'No billing account is linked yet.'};const session=await stripe.billingPortal.sessions.create({customer:profile.stripe_customer_id,return_url:siteConfig.url+'/account'});return {url:session.url};}
export const billingEvents=new Set(['checkout.session.completed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','invoice.payment_failed','invoice.paid','checkout.session.async_payment_succeeded']);
export async function processBillingEvent(stripe:Stripe,repo:BillingRepository,event:Stripe.Event,prices:{monthly:string;annual:string}){if(!billingEvents.has(event.type))return;
 const object=event.data.object as unknown as {customer?:string|{id:string}|null};const customer=typeof object.customer==='string'?object.customer:object.customer?.id;if(!customer)throw new Error('Missing customer');const userId=await repo.userForCustomer(customer);if(!userId)throw new Error('Unlinked customer');const token=await repo.lock(userId);try{
 // Serialize per-account, then fetch Stripe's current objects, never stale event payloads.
 const list=await customerSubscriptions(stripe,customer);const current=[];for(const sub of list)current.push(await stripe.subscriptions.retrieve(sub.id));const known=[prices.monthly,prices.annual];const chosen=selectSubscription(current,known);const state=chosen?subscriptionSnapshot(chosen,known):{stripe_subscription_id:null,stripe_subscription_status:null,stripe_price_id:null,subscription_current_period_end:null,plan:'free' as const};if(chosen&&state.stripe_price_id&&!known.includes(state.stripe_price_id))console.warn('Toolgrain billing: unrecognized subscription price; Pro denied.');await repo.write(userId,token,customer,state);
 }finally{await repo.release(userId,token);}
}

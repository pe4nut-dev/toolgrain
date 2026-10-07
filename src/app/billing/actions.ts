'use server';
import {logBillingFailure} from '@/lib/stripe/diagnostics';
import {redirect} from 'next/navigation';
import {getAccount} from '@/lib/auth/account';
import {getStripe} from '@/lib/stripe/server';
import {billingAvailable,stripeConfig} from '@/lib/stripe/config';
import {billingRepository} from '@/lib/stripe/repository';
import {startCheckout,startPortal,type BillingResult} from '@/lib/stripe/service';
export type BillingActionState={error?:string};
export async function checkoutAction(_:BillingActionState,form:FormData):Promise<BillingActionState>{const account=await getAccount();if(!account.user)redirect('/login?next=%2Fpricing');const stripe=getStripe(),config=stripeConfig();if(!stripe||!config||!billingAvailable())return {error:'Billing is not available yet. Free tools remain available.'};let result:BillingResult;try{result=await startCheckout(stripe,billingRepository(),account.user,form.get('cycle'),config);}catch(error){logBillingFailure(error,'checkout.repository.initialize');return {error:'Checkout could not be started. Please try again shortly.'};}if(result.url)redirect(result.url);return {error:result.error};}
export async function portalAction():Promise<void>{const account=await getAccount();if(!account.user)redirect('/login?next=%2Faccount');const stripe=getStripe();if(!stripe||!billingAvailable())redirect('/account?billing=unavailable');let result:BillingResult;try{result=await startPortal(stripe,billingRepository(),account.user);}catch(error){logBillingFailure(error,'portal.start');redirect('/account?billing=unavailable');}if(result.url)redirect(result.url);redirect('/account?billing=unavailable');}

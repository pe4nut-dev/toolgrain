import Link from 'next/link';
import {portalAction} from '@/app/billing/actions';
import {stripeConfig} from '@/lib/stripe/config';
import {BillingStatus} from '@/components/auth/billing-status';
import {redirect} from 'next/navigation';
import {Container} from '@/components/ui/shared';
import {getAccount} from '@/lib/auth/account';
import {AccountContent} from '@/components/auth/account-content';
import {SignOut} from '@/components/auth/sign-out';
import {pageMetadata} from '@/config/metadata';
export const metadata=pageMetadata('Account','Your Toolgrain account and current plan.','/account',false);
export default async function Page({searchParams}:{searchParams:Promise<{checkout?:string;billing?:string}>}){const params=await searchParams;const account=await getAccount();if(!account.user)redirect('/login?next=%2Faccount');return <Container className="page-section auth-page"><AccountContent account={account}><BillingStatus plan={account.plan} returned={params.checkout==='success'}/><div className="account-billing"><h2>Billing</h2>{account.plan==='pro'&&<p>Toolgrain Pro</p>}{account.profile?.stripe_price_id&&<p>Billing cycle: {account.profile.stripe_price_id===stripeConfig()?.monthly?'Monthly':account.profile.stripe_price_id===stripeConfig()?.annual?'Annual':'Not available'}</p>}{account.profile?.stripe_subscription_status&&<p>Subscription status: {account.profile.stripe_subscription_status.replaceAll('_',' ')}</p>}{account.profile?.subscription_current_period_end&&<p>Current period ends: {new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(account.profile.subscription_current_period_end))}</p>}{account.profile?.stripe_customer_id?<form action={portalAction}><button className="button">Manage billing</button></form>:<Link href="/pricing" className="button">Upgrade to Toolgrain Pro</Link>}{params.billing==='unavailable'&&<p role="alert">Billing management is temporarily unavailable. Please try again shortly.</p>}{params.billing==='pending'&&<p role="status">A subscription is already linked. Manage billing or refresh this page for its latest status.</p>}</div><SignOut/></AccountContent></Container>;}

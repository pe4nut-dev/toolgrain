'use client';
import React,{useActionState} from 'react';
import Link from 'next/link';
import {checkoutAction,type BillingActionState} from '@/app/billing/actions';
import {trackToolgrainEvent} from '@/lib/analytics-events';
import {continueToCheckout} from '@/lib/checkout-navigation';
async function submitCheckout(previous:BillingActionState,form:FormData):Promise<BillingActionState>{
 const state=await checkoutAction(previous,form);
 continueToCheckout(state,url=>window.location.assign(url));
 return state;
}
export function BillingButtons({signedIn,plan,available}:{signedIn:boolean;plan:'free'|'pro';available:boolean}){
 const [state,action,pending]=useActionState(submitCheckout,{});
 if(plan==='pro')return <><p className="plan-note">Current plan</p><Link href="/account" className="button">Manage billing</Link></>;
 if(!available)return <><button className="button" disabled>Billing unavailable</button><p className="plan-note">Free tools remain available.</p></>;
 const upgrade=()=>trackToolgrainEvent('upgrade_clicked',{plan});
 if(!signedIn)return <Link href="/login?next=%2Fpricing" className="button" onClick={upgrade}>Sign in to upgrade</Link>;
 return <form action={action} onSubmit={upgrade} className="billing-actions"><button className="button" name="cycle" value="monthly" disabled={pending}>Upgrade monthly</button><button className="button secondary" name="cycle" value="annual" disabled={pending}>Choose annual</button>{pending&&<p role="status">Opening secure checkout…</p>}{state.error&&<p role="alert">{state.error}</p>}</form>;
}

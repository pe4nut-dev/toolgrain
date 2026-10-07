import {BrandLogo} from '@/components/brand/brand-logo';
import React from 'react';
import {plans} from '../../config/plans';
import type {AccountSnapshot} from '../../lib/auth/account-data';
export function AccountContent({account,children}:{account:AccountSnapshot;children?:React.ReactNode}){return <section className="auth-card"><div className="auth-brand"><BrandLogo compact /></div><h1>Account</h1><dl className="legal-details"><dt>Email</dt><dd>{account.user?.email??'Not available'}</dd><dt>Plan</dt><dd>{plans[account.plan].name}</dd><dt>Membership</dt><dd>{plans[account.plan].name} plan</dd></dl>{!account.profileAvailable&&<p role="status">Account details could not be loaded. Free limits apply until your profile is available.</p>}{children}<div className="account-billing"><h2>Billing</h2><p className="muted">Pro subscriptions are coming soon.</p></div></section>;}

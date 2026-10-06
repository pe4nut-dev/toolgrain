import {redirect} from 'next/navigation';
import {Container} from '@/components/ui/shared';
import {AuthForm} from '@/components/auth/auth-form';
import {getAccount} from '@/lib/auth/account';
import {safeReturnPath} from '@/lib/auth/return-path';
import {supabaseConfig} from '@/lib/supabase/config';
import {pageMetadata} from '@/config/metadata';
export const metadata=pageMetadata('Sign in','Toolgrain account access. Free tools remain available without registration.','/login',false);
export default async function Page({searchParams}:{searchParams:Promise<{next?:string;error?:string}>}){const params=await searchParams,next=safeReturnPath(params.next);const account=await getAccount();if(account.user)redirect(next);return <div className="login-backdrop"><Container className="page-section auth-page"><AuthForm mode="login" next={next} available={!!supabaseConfig()} notice={params.error==='link'?'This sign-in link is invalid or has expired. Request a new link.':params.error==='unavailable'?'Account sign-in is not available yet.':undefined}/></Container></div>;}

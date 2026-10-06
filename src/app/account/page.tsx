import {redirect} from 'next/navigation';
import {Container} from '@/components/ui/shared';
import {getAccount} from '@/lib/auth/account';
import {AccountContent} from '@/components/auth/account-content';
import {SignOut} from '@/components/auth/sign-out';
import {pageMetadata} from '@/config/metadata';
export const metadata=pageMetadata('Account','Your Toolgrain account and current plan.','/account',false);
export default async function Page(){const account=await getAccount();if(!account.user)redirect('/login?next=%2Faccount');return <Container className="page-section auth-page"><AccountContent account={account}><SignOut/></AccountContent></Container>;}

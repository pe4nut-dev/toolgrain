import {getAccount} from '@/lib/auth/account';
import {billingAvailable} from '@/lib/stripe/config';
import {pricingMetadata} from '@/config/pricing-metadata';
import {Container} from '@/components/ui/shared';
import {PricingContent} from '@/components/pricing/pricing-content';
export const metadata=pricingMetadata;
export default async function Pricing(){const account=await getAccount();return <Container className="page-section"><PricingContent signedIn={!!account.user} plan={account.plan} available={billingAvailable()}/></Container>;}

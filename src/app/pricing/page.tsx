import {pricingMetadata} from '@/config/pricing-metadata';
import {Container} from '@/components/ui/shared';
import {PricingContent} from '@/components/pricing/pricing-content';
export const metadata=pricingMetadata;
export default function Pricing(){return <Container className="page-section"><PricingContent/></Container>;}

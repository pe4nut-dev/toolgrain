import { pageMetadata } from '@/config/metadata';
import { Container, ButtonLink } from '@/components/ui/shared';
export const metadata=pageMetadata('Pricing','The current CRM CSV Cleaner is free to use. No paid plans or subscriptions are offered.','/pricing',false);
export default function Pricing(){return <Container className="page-section prose-page"><p className="eyebrow">CURRENT AVAILABILITY</p><h1 className="page-title">Free to use.</h1><p className="page-description">The CRM CSV Cleaner is currently free to use. No account or subscription is required.</p><p>No paid plans are offered. If paid options are introduced in the future, their features and prices will be explained before purchase.</p><ButtonLink href="/tools/crm-csv-cleaner">Open CRM CSV Cleaner</ButtonLink></Container>}

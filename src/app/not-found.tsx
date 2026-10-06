import { Container, ButtonLink } from '@/components/ui/shared';
export default function NotFound() { return <Container className="page-section"><p className="eyebrow">404</p><h1 className="page-title">This page isn’t in the toolkit.</h1><p className="page-description">The link may have changed, or this tool doesn’t exist yet.</p><ButtonLink href="/tools">Explore tools</ButtonLink></Container>; }

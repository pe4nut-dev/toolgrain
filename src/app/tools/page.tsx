import { pageMetadata } from '@/config/metadata';
import { Suspense } from 'react';
import { Container } from '@/components/ui/shared';
import { ToolDirectoryWithCategory } from '@/components/tools/tool-directory-wrapper';
export const metadata = pageMetadata('Explore tools','Browse focused tools for data, ecommerce, documents and repetitive business tasks. Start with the CRM CSV Cleaner.','/tools');
export default function Tools() { return <Container className="page-section"><p className="eyebrow">YOUR EVERYDAY TOOLKIT</p><h1 className="page-title">A tool for the task.</h1><p className="page-description">Small, focused helpers for the work that gets in the way.</p><Suspense fallback={<p>Loading tool directory…</p>}><ToolDirectoryWithCategory /></Suspense></Container>; }

import { pageMetadata } from '@/config/metadata';
import { Container } from '@/components/ui/shared';
import { ToolDirectory } from '@/components/tools/tool-directory';

export const metadata = pageMetadata('Business Tools for Data, CSV Files & Repetitive Tasks | Toolgrain','Explore focused Toolgrain utilities for CSV cleanup, file comparison, ecommerce data, documents and everyday business tasks.','/tools');

export default async function Tools({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const params = await searchParams;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;

  return <Container className="page-section"><p className="eyebrow">YOUR EVERYDAY TOOLKIT</p><h1 className="page-title">A tool for the task.</h1><p className="page-description">Small, focused helpers for the work that gets in the way.</p><ToolDirectory key={category ?? 'all'} initialCategory={category} /></Container>;
}

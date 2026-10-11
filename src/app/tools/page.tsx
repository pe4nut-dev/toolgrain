import { pageMetadata } from '@/config/metadata';
import { Container } from '@/components/ui/shared';
import { ToolDirectory } from '@/components/tools/tool-directory';

export const metadata = pageMetadata('Online CSV Tools: Cleaner, Compare & Shopify Converter | Toolgrain','Explore CRM CSV Cleaner, CSV Compare and Supplier CSV to Shopify. Review and export CSV data locally in your browser, with Free and Pro limits.','/tools');

export default async function Tools({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const params = await searchParams;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;

  return <Container className="page-section"><p className="eyebrow">YOUR EVERYDAY TOOLKIT</p><h1 className="page-title">Online CSV Tools</h1><p className="page-description">Clean contact CSVs, compare files by key or map supplier columns for Shopify product import. Choose one of the three available tools below.</p><ToolDirectory key={category ?? 'all'} initialCategory={category} /></Container>;
}

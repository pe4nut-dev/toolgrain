import type { Metadata } from 'next';
import { pageMetadata } from '@/config/metadata';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { tools, getTool, getCategory, getRelatedTools } from '@/lib/tools';
import { Container, SectionHeading } from '@/components/ui/shared';
import { StatusBadge, ToolGrid } from '@/components/tools/tool-card';
import { ToolWorkspace } from '@/components/tools/tool-workspace';
export function generateStaticParams() { return tools.map(tool => ({ slug: tool.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tool = getTool((await params).slug);
  return tool ? pageMetadata(tool.name,tool.shortDescription,'/tools/'+tool.slug,tool.status!=='coming-soon') : { title: 'Tool not found', robots:{index:false,follow:true} };
}
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const Icon = tool.icon;
  return <Container className="page-section">
    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><Link href="/tools">Tools</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{tool.name}</span></nav>
    <div className="tool-heading">
      <span className={'tool-icon ' + tool.category}><Icon size={28} aria-hidden="true" /></span>
      <div><div className="tool-meta"><span className="category-badge">{getCategory(tool.category).name}</span><StatusBadge status={tool.status} /></div>
        <h1 className="page-title">{tool.name}</h1><p className="page-description">{tool.description}</p>
        {tool.privacy && <p className="privacy-badge"><ShieldCheck size={15} aria-hidden="true" />{tool.privacy.label}</p>}
      </div>
    </div>
    <ToolWorkspace tool={tool} />
    <section className="section"><SectionHeading title={tool.status === 'coming-soon' ? 'Planned workflow' : 'How it works'} description={tool.slug === 'crm-csv-cleaner' ? 'Analyze locally, apply safe fixes, review duplicates and download a cleaned copy.' : 'This tool is coming soon.'} /><ol className="steps">{tool.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><h3>{step}</h3></li>)}</ol></section>
    <section className="section"><SectionHeading title="More tools for your workflow" /><ToolGrid items={getRelatedTools(tool)} /></section>
    <section className="faq section"><SectionHeading title="A few useful answers" />{tool.faqs.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>
  </Container>;
}

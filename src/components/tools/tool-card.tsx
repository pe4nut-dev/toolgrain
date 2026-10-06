import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getCategory, type Tool } from '@/lib/tools';
import { StatusBadge } from './status-badge';
import { PrivacyBadge } from './privacy-badge';
export { StatusBadge } from './status-badge';

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <Link href={'/tools/' + tool.slug} className={'tool-card' + (tool.featured ? ' featured' : '')}>
      <div className="card-top">
        <span className={'tool-icon ' + tool.category}><Icon size={24} aria-hidden="true" /></span>
        <div className="card-top-right">
          {tool.featured && <span className="featured-badge">First release</span>}
          <ArrowUpRight size={18} className="card-arrow" aria-hidden="true" />
        </div>
      </div>
      <h3>{tool.name}</h3>
      <p>{tool.shortDescription}</p>
      <div className="card-bottom">
        <span className="category-badge">{getCategory(tool.category).name}</span>
        <StatusBadge status={tool.status} />
      </div>
      <PrivacyBadge privacy={tool.privacy} />
    </Link>
  );
}
export function ToolGrid({ items }: { items: readonly Tool[] }) {
  return <div className="tool-grid">{items.map(tool => <ToolCard key={tool.slug} tool={tool} />)}</div>;
}

import Link from 'next/link';
import { Upload, Columns3, Download, Check, GitCompareArrows } from 'lucide-react';
import { SectionHeading } from '@/components/ui/shared';

const steps = [
  { title: 'Upload', description: 'Choose your supplier CSV or try our sample data.', icon: Upload },
  { title: 'Map', description: 'Match supplier columns to Shopify product fields.', icon: Columns3 },
  { title: 'Review & export', description: 'Fix issues and download your Shopify CSV.', icon: Download },
];
const groups = [
  { title: 'What you can do', items: ['Map supplier columns', 'Generate product handles', 'Find and fix data issues', 'Export Shopify-compatible CSV'] },
  { title: 'Best for', items: ['First-time product imports', 'Supplier catalog preparation', 'Price and inventory checks', 'Reviewing product data before upload'] },
];

export function ShopifyInformation() {
  return <div className="shopify-information">
    <section aria-labelledby="shopify-how-heading">
      <div id="shopify-how-heading"><SectionHeading title="How it works" description="From supplier CSV to Shopify-ready file in three simple steps." /></div>
      <ol className="shopify-info-steps">
        {steps.map(({ title, description, icon: Icon }, index) => <li key={title}>
          <div className="shopify-info-step-marker"><span>{String(index + 1).padStart(2, '0')}</span><Icon size={20} aria-hidden="true" /></div>
          <h3>{title}</h3><p>{description}</p>
        </li>)}
      </ol>
    </section>
    <section className="shopify-info-panel" aria-labelledby="shopify-purpose-heading">
      <h2 id="shopify-purpose-heading">Built for simpler Shopify imports</h2>
      <p className="shopify-info-intro">Prepare and validate simple product data before importing it into Shopify. No manual spreadsheet restructuring required for supported fields.</p>
      <div className="shopify-info-columns">{groups.map(group => <div key={group.title}>
        <h3>{group.title}</h3><ul>{group.items.map(item => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
      </div>)}</div>
      <p className="shopify-info-limitation">Designed for new, simple products. Variants and existing-product synchronization are not currently supported.</p>
    </section>
    <section className="shopify-info-cta" aria-labelledby="shopify-compare-heading">
      <GitCompareArrows size={22} aria-hidden="true" />
      <div><h2 id="shopify-compare-heading">Need to compare supplier files first?</h2><p>Spot added, removed and changed rows before preparing your next import.</p></div>
      <Link className="button secondary" href="/tools/csv-compare">CSV Compare →</Link>
    </section>
  </div>;
}

import Link from 'next/link';
import { Upload, ScanSearch, Download, Check, GitCompareArrows } from 'lucide-react';
import { SectionHeading } from '@/components/ui/shared';

export function DataToolInformation({ compare }: { compare: boolean }) {
  const steps = compare ? [
    ['Add files', 'Upload two CSV files or try sample catalogs.'],
    ['Compare', 'Choose a matching key and find differences.'],
    ['Review & export', 'Inspect changes and download the available results.'],
  ] : [
    ['Upload', 'Add your CRM CSV or try fictional sample contacts.'],
    ['Analyze', 'Detect duplicates, invalid emails and data issues.'],
    ['Review & export', 'Review corrections and download your cleaned CSV.'],
  ];
  const groups = compare ? [
    ['What you can do', ['Compare records by a selected key', 'Find added, removed and changed rows', 'Review old and new values', 'Download comparison CSV reports']],
    ['Best for', ['Comparing supplier catalog versions', 'Reviewing CRM exports', 'Checking price and stock changes', 'Inspecting updated datasets']],
  ] as const : [
    ['What you can do', ['Find duplicate contact groups', 'Flag invalid emails and missing values', 'Apply and undo safe corrections', 'Review duplicates and export cleaned data']],
    ['Best for', ['Preparing CRM imports', 'Reviewing contact lists', 'Checking contact data quality', 'Cleaning CRM exports']],
  ] as const;
  const icons = [Upload, ScanSearch, Download];
  return <div className="shopify-information data-tool-information">
    <section aria-label="How it works"><SectionHeading title="How it works" />
      <ol className="shopify-info-steps">{steps.map(([title, description], index) => {
        const Icon = icons[index];
        return <li key={title}><div className="shopify-info-step-marker"><span>{String(index + 1).padStart(2, '0')}</span><Icon size={20} aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p></li>;
      })}</ol>
    </section>
    <section className="shopify-info-panel" aria-label="About this tool">
      <h2>{compare ? 'Find what changed between two CSV files' : 'Cleaner CRM data, less manual work'}</h2>
      <p className="shopify-info-intro">{compare ? 'Compare shared columns using a key you choose. Review meaningful differences even when rows are reordered, with all processing local to your browser.' : 'Analyze contact data locally, review suggested corrections and explicitly choose which duplicate records to keep. Your original data remains available for review.'}</p>
      <div className="shopify-info-columns">{groups.map(([title, items]) => <div key={title}><h3>{title}</h3><ul>{items.map(item => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul></div>)}</div>
      <p className="shopify-info-limitation">{compare ? 'Missing or duplicate keys are reported separately. Only shared non-key columns are compared; key matching trims whitespace and remains case-sensitive.' : 'Duplicate matches require your review. Email checks assess format, not mailbox deliverability. Missing contact information needs manual review.'}</p>
    </section>
    <section className="shopify-info-cta" aria-label="Related tool"><GitCompareArrows size={22} aria-hidden="true" /><div><h2>{compare ? 'Need to clean contact data first?' : 'Need to compare two exports?'}</h2><p>{compare ? 'Review duplicate contacts and data quality before comparing your exports.' : 'Spot added, removed and changed rows between two CSV files.'}</p></div><Link className="button secondary" href={compare ? '/tools/crm-csv-cleaner' : '/tools/csv-compare'}>{compare ? 'CRM CSV Cleaner' : 'CSV Compare'} →</Link></section>
  </div>;
}

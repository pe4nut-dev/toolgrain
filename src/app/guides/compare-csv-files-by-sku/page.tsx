import Link from 'next/link';
import { Container, ButtonLink } from '@/components/ui/shared';
import { pageMetadata } from '@/config/metadata';
import { ToolTour } from '@/components/guides/tool-tour';
import { csvCompareTourSteps } from '@/config/csv-compare-tour';

export const metadata = pageMetadata(
  'How to Compare Two CSV Files by SKU | Toolgrain',
  'Learn how to compare CSV files by SKU, detect added, removed and changed rows, and handle reordered product catalogs using practical examples.',
  '/guides/compare-csv-files-by-sku',
);

const original = `sku,product_name,price,stock
00012345,Fictional linen pouch,12.90,20
00012346,Fictional desk tray,18.00,15
00012347,Fictional garden scoop,9.50,30
00012348,Fictional cotton cloth,6.00,40`;
const updated = `sku,product_name,price,stock
00012347,Fictional garden scoop,9.50,30
00012346,Fictional desk tray,18.00,11
00012349,Fictional paper basket,14.00,12
00012345,Fictional linen pouch,13.90,20`;
const results = [
  ['00012345', 'Changed', 'Price: 12.90 → 13.90; stock stays 20.'],
  ['00012346', 'Changed', 'Stock: 15 → 11; price stays 18.00.'],
  ['00012347', 'Unchanged', 'All compared values are identical.'],
  ['00012348', 'Removed', 'Present only in the original file.'],
  ['00012349', 'Added', 'Present only in the updated file.'],
];

export default function CompareBySkuGuide() {
  return <Container className="page-section prose-page csv-guide"><article>
    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/tools">Online CSV Tools</Link><span aria-hidden="true">/</span><Link href="/tools/csv-compare">CSV Compare</Link></nav>
    <p className="eyebrow">PRACTICAL CSV GUIDE</p>
    <h1 className="page-title">How to Compare Two CSV Files by SKU (Even When Rows Are Reordered)</h1>
    <p className="page-description">Compare two CSV files by SKU to find product changes without confusing a different row order with different data.</p>
    <p>A supplier might sort a new catalog by category instead of product name. Comparing row 2 with row 2 then puts unrelated products side by side. A CSV diff by key matches the same product first, so reordered rows alone do not count as changes.</p>

    <section aria-labelledby="catalog-example">
      <h2 id="catalog-example">Example: Original vs. updated catalog</h2>
      <p>These small catalogs contain entirely fictional products. Each file has four products, but the updated file changes the order and replaces one product.</p>
      <div className="guide-examples"><figure><figcaption>Original catalog</figcaption><pre tabIndex={0} aria-label="Original fictional catalog CSV"><code>{original}</code></pre></figure><figure><figcaption>Updated catalog</figcaption><pre tabIndex={0} aria-label="Updated fictional catalog CSV"><code>{updated}</code></pre></figure></div>
      <p>Using <code>sku</code> as the matching key gives <strong>1 added, 1 removed, 2 changed and 1 unchanged product</strong>. The two changed products each have one changed field.</p>
      <div className="csv-table-scroll" role="region" aria-label="Example comparison results" tabIndex={0}><table><caption>Expected results when matching by SKU</caption><thead><tr><th scope="col">SKU</th><th scope="col">Result</th><th scope="col">Difference</th></tr></thead><tbody>{results.map(([sku, status, difference]) => <tr key={sku}><th scope="row"><code>{sku}</code></th><td>{status}</td><td>{difference}</td></tr>)}</tbody></table></div>
      <p>The tool’s bundled sample catalogs are a separate, larger fictional example. Their results differ from this four-product walkthrough.</p>
    </section>

    <section aria-labelledby="sku-matching">
      <h2 id="sku-matching">Why matching by SKU works</h2>
      <p>A SKU acts as a record identifier. Instead of relying on row position, the comparison looks up the same SKU in both files and compares its shared non-key columns. A SKU found only in the updated file is added; one found only in the original is removed.</p>
      <p>SKUs must be unique within each file and consistent between files. Toolgrain trims surrounding whitespace in matching keys, but keeps case significant: <code>ABC-01</code> and <code>abc-01</code> are different keys. It does not use fuzzy matching or automatically resolve conflicting keys.</p>
      <p>Only shared non-key columns are compared. Columns found in just one file are reported in the column structure summary; they do not themselves mark a matched row as changed.</p>
    </section>

    <ToolTour title="See CSV Compare in action" steps={csvCompareTourSteps} />
    <div className="guide-tour-cta"><ButtonLink href="/tools/csv-compare">Try CSV Compare with sample files →</ButtonLink><p>No account required. Your CSV files stay in your browser.</p><p className="muted">Tour screenshots use the larger bundled sample catalogs, not the four-product example above.</p></div>

    <section aria-labelledby="compare-steps">
      <h2 id="compare-steps">Step-by-step: Compare files with Toolgrain</h2>
      <ol className="guide-steps">
        <li><strong>Open <Link href="/tools/csv-compare">CSV Compare</Link>.</strong> Parsing, comparison and export run locally in your browser.</li>
        <li><strong>Add the original and updated files.</strong> Upload each CSV to its corresponding area, or choose “Try with sample files” to load the bundled fictional catalogs. Use CSV files with a header row.</li>
        <li><strong>Select SKU in both matching-key fields.</strong> Choose the SKU column under “Old file key” and “New file key”. Header names can differ between files; confirm that both selected columns identify the same products.</li>
        <li><strong>Run the comparison.</strong> Select “Compare CSVs” after both files and keys are ready.</li>
        <li><strong>Review the result groups.</strong> Inspect added, removed and changed rows. Unchanged rows remain separate. Review missing or duplicate keys in the key issues section rather than treating them as reliable matches.</li>
        <li><strong>Inspect changed values.</strong> Expand a changed record to see its shared columns side by side, with old and new values and highlighted changed cells.</li>
        <li><strong>Export the available results.</strong> Use the comparison’s export actions to download CSV reports for the result groups you need. This produces reports, not an automatically merged product catalog.</li>
      </ol>
    </section>

    <section aria-labelledby="common-mistakes"><h2 id="common-mistakes">Common mistakes</h2><div className="shopify-info-panel">
      <h3>Comparing by row position</h3><p>A different sort order can make unchanged products appear different. Match by a stable key before comparing values.</p>
      <h3>Losing leading zeros in spreadsheets</h3><p>Import SKU columns as text in spreadsheet software. If <code>00012345</code> becomes <code>12345</code> before saving, it is a different identifier. Toolgrain preserves CSV values as strings, but cannot restore zeros already lost in another application.</p>
      <h3>Duplicate or missing matching keys</h3><p>Each product needs a non-empty, unique SKU within its file. Toolgrain reports missing and duplicate keys separately and excludes ambiguous records from normal comparison groups. Correct the source files and compare again; conflicts are not resolved automatically.</p>
      <h3>Inconsistent identifier or value formatting</h3><p>Use the same SKU spelling, case and leading zeros in both files. Surrounding key whitespace is trimmed; other identifier differences remain significant. Shared data values are compared as text, so <code>12.9</code> and <code>12.90</code> count as a change even if you regard them as the same price.</p>
    </div></section>
    <section className="shopify-info-cta" aria-labelledby="guide-conclusion"><div><h2 id="guide-conclusion">Compare your product catalogs by SKU</h2><p>Use a stable key to separate reordered rows from actual product changes. Try the fictional sample files before comparing your own catalogs.</p><ButtonLink href="/tools/csv-compare">Open CSV Compare</ButtonLink></div></section>
  </article></Container>;
}

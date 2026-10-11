import Link from 'next/link';
import { Container, ButtonLink } from '@/components/ui/shared';
import { ToolTour } from '@/components/guides/tool-tour';
import { pageMetadata } from '@/config/metadata';
import { shopifyTourSteps } from '@/config/shopify-tour';

export const metadata = pageMetadata(
  'How to Convert Supplier CSV Files for Shopify | Toolgrain',
  'Learn how to map supplier CSV columns to Shopify fields, fix product data issues and prepare Shopify-compatible CSV files with a practical example.',
  '/guides/supplier-csv-to-shopify',
);

const example = `Supplier SKU,Product name,Description,Price,Stock quantity,Supplier category
00012345,Willow Desk Tray,Fictional desk tray,18.90,24,Desk accessories
00012350,,Fictional missing-name product,22.00,16,Home accessories
00012352,Trail Bottle Sleeve,Fictional fabric sleeve,not-a-price,42,Travel accessories
00012353,Sprout Plant Marker,Fictional wooden marker,3.20,many,Garden accessories
00012357,Pebble Soap Dish,Fictional bathroom dish,,30,Bath accessories`;
const mappings = [
  ['Supplier SKU', 'SKU', 'Keep the identifier as text, including leading zeros.'],
  ['Product name', 'Title', 'Required: each product needs a non-empty title.'],
  ['Description', 'Description', 'Optional product description.'],
  ['Price', 'Price', 'Review the price format and any missing values.'],
  ['Stock quantity', 'Inventory quantity', 'Mapped values must be non-negative whole numbers.'],
  ['Supplier category', 'Type', 'A free-form label, not an automatic taxonomy match.'],
];

export default function ShopifyGuide() {
  return <Container className="page-section prose-page csv-guide"><article>
    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/tools">Online CSV Tools</Link><span aria-hidden="true">/</span><Link href="/tools/supplier-csv-to-shopify">Supplier CSV to Shopify</Link></nav>
    <p className="eyebrow">PRACTICAL CSV GUIDE</p>
    <h1 className="page-title">How to Convert a Supplier CSV for Shopify</h1>
    <p className="page-description">Prepare Shopify import CSV data by mapping supplier columns, checking values and reviewing the output before importing.</p>
    <p>A supplier catalog might call its product name “Product name” instead of “Title”, use a different price format, or contain missing titles and invalid stock values. Renaming a few headers is not always enough: review the meaning and formatting of the data before importing it.</p>
    <p>Toolgrain’s supplier CSV to Shopify converter prepares a downloadable file. It does not directly import products into a Shopify store or connect to your store. You remain responsible for reviewing the file and completing the import in Shopify.</p>

    <section aria-labelledby="supplier-example"><h2 id="supplier-example">Example supplier CSV</h2>
      <p>This five-product example is entirely fictional. It deliberately includes a missing title, an invalid price, an invalid stock quantity and a blank price so you can see what needs review.</p>
      <figure><figcaption>Fictional supplier input</figcaption><pre tabIndex={0} aria-label="Fictional supplier CSV example"><code>{example}</code></pre></figure>
      <h3>Map source columns to Shopify fields</h3>
      <div className="csv-table-scroll" role="region" aria-label="Supplier to Shopify column mapping" tabIndex={0}><table><caption>Suggested mapping for the example</caption><thead><tr><th scope="col">Supplier column</th><th scope="col">Shopify field</th><th scope="col">What to review</th></tr></thead><tbody>{mappings.map(([source, target, note]) => <tr key={source}><th scope="row">{source}</th><td>{target}</td><td>{note}</td></tr>)}</tbody></table></div>
      <p>Toolgrain suggests mappings for recognized headers; confirm them rather than assuming every supplier uses the same meaning. Title is required by the converter. Other mappings are optional, and unmapped handles are generated from the product title.</p>
      <h3>Type is different from Product category</h3>
      <p><strong>Type</strong> is a free-form product label. A supplier value such as “Desk accessories” can be mapped there. Shopify’s <strong>Product category</strong> uses its standardized taxonomy, so an arbitrary supplier category is not automatically a valid category value.</p>
      <p>Toolgrain does not reconcile supplier categories or verify taxonomy values. Mapping Product category produces a review warning. Check Shopify’s <a className="text-link" href="https://help.shopify.com/en/manual/products/import-export/using-csv">product CSV documentation</a> before selecting standardized categories. Inventory quantity in the product CSV is intended for single-location stores; multi-location inventory needs a separate Shopify workflow.</p>
    </section>

    <section aria-labelledby="supplier-issues"><h2 id="supplier-issues">Common data issues: errors vs. warnings</h2>
      <div className="shopify-info-panel">
        <h3>Missing product titles block export</h3><p>In the example, SKU <code>00012350</code> has no product name. Map the correct source column, then supply a meaningful title. A missing Title mapping also blocks export.</p>
        <h3>Invalid prices block export</h3><p><code>not-a-price</code> is not a valid monetary value. Correct it to the intended non-negative amount, such as <code>16.90</code>. Review the Price format setting when a supplier uses decimal commas or points.</p>
        <h3>Invalid inventory quantities block export</h3><p><code>many</code> is not a quantity. When Inventory quantity is mapped, the converter requires a non-negative whole number, such as <code>48</code>. A blank mapped quantity is also an error.</p>
        <h3>Missing optional data needs context</h3><p>Optional unmapped fields are generally omitted. A blank mapped Price produces a warning about Shopify’s default price rather than blocking export. Review it deliberately; a warning is not confirmation that the value is right for your store. Empty mapped image URLs also warn; malformed mapped image URLs are errors. Image availability is not checked.</p>
        <h3>Preserve identifiers</h3><p>SKU values remain strings: <code>00012345</code> must not become <code>12345</code>. Long numeric-looking SKUs must retain every digit. Import identifier columns as text in spreadsheet software; Toolgrain cannot restore digits or zeros lost before upload. Duplicate SKUs produce warnings, not automatic merging.</p>
      </div>
      <p>With the six mappings above, this example produces <strong>3 blocking errors and 1 warning</strong>. Set the missing title to “Maple Bookmark”, replace the invalid price with <code>16.90</code> and stock with <code>48</code> to remove the errors. The blank price warning remains if you leave that value empty, even if you decide to use the default.</p>
      <p>Export is enabled when there are products and no blocking errors. Warnings remain your responsibility to review. Passing Toolgrain’s checks does not guarantee a successful Shopify import.</p>
    </section>

    <ToolTour title="See the Shopify Converter in action" steps={shopifyTourSteps} />
    <div className="guide-tour-cta"><ButtonLink href="/tools/supplier-csv-to-shopify">Try Supplier CSV to Shopify</ButtonLink><p>Start with fictional sample products. No account required.</p><p className="muted">The tour uses the tool’s larger 14-product sample, not the five-product example above. The final screenshot shows the error filter after all issues have been corrected.</p></div>

    <section aria-labelledby="shopify-conversion-steps"><h2 id="shopify-conversion-steps">Step-by-step: Convert your supplier CSV</h2>
      <ol className="guide-steps">
        <li><strong>Open <Link href="/tools/supplier-csv-to-shopify">Supplier CSV to Shopify</Link>.</strong> File parsing, mapping, validation and export run locally in your browser.</li>
        <li><strong>Add your CSV or try the sample.</strong> Choose your supplier file, or select “Try with sample CSV” to explore 14 fictional products with intentional issues.</li>
        <li><strong>Review suggested mappings.</strong> Check where Title, SKU, Description, Price and Inventory quantity get their values.</li>
        <li><strong>Adjust mappings where necessary.</strong> Choose the correct supplier column for each supported field. Review optional mappings, Price format and import defaults. The default status is draft and publishing is false unless you change them or map those fields.</li>
        <li><strong>Select “Validate and preview”.</strong> Generate the Shopify output preview and review the error and warning totals.</li>
        <li><strong>Review errors and warnings.</strong> Use “Rows with errors”, “Rows with warnings” and “Next issue” to inspect affected cells. The next-issue button opens an editable problem cell when supported.</li>
        <li><strong>Correct editable values.</strong> Click an editable cell, enter its intended value and save with the Save icon or Enter. Cancel with X or Escape; the information icon reveals issue details. Saving revalidates the working output. These corrections do not rewrite the uploaded source file.</li>
        <li><strong>Download the CSV.</strong> Once blocking errors are resolved, review any warnings and select “Download Shopify CSV”.</li>
        <li><strong>Review Shopify’s own import preview.</strong> Open the product import workflow in Shopify, select the prepared file and check the preview and any messages before completing the import.</li>
      </ol>
    </section>

    <section aria-labelledby="shopify-guide-limitations"><h2 id="shopify-guide-limitations">Limitations to check before import</h2>
      <ul><li>Designed for new simple products; variants are not supported.</li><li>Existing-product synchronization is not supported. Do not use this workflow to overwrite existing products with variants.</li><li>Multiple images per product are not supported.</li><li>Review Shopify import compatibility, field dependencies and your store’s requirements in Shopify’s own preview.</li><li>Spreadsheet software can alter leading-zero or long identifiers. Recheck SKUs after opening and saving a CSV elsewhere.</li></ul>
      <p>Use the converter to prepare and inspect supported fields, not as a guarantee that Shopify will accept every file.</p>
    </section>
    <section className="shopify-info-cta" aria-labelledby="shopify-guide-conclusion"><div><h2 id="shopify-guide-conclusion">Prepare your supplier CSV with a reviewable workflow</h2><p>Check mappings, correct invalid values and inspect the final file before importing it into Shopify.</p><ButtonLink href="/tools/supplier-csv-to-shopify">Try Supplier CSV to Shopify</ButtonLink></div></section>
    <p>Working with an updated supplier catalog? <Link className="text-link" href="/tools/csv-compare">Compare catalog versions by SKU with CSV Compare →</Link></p>
  </article></Container>;
}

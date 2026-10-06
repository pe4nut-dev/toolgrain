import {SelectedFiles} from '../src/components/tools/selected-files';
import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseCsvText} from '../src/lib/csv/parse-csv';
import {suggestMappings} from '../src/lib/shopify/mapping';
import {transformSupplier} from '../src/lib/shopify/transform';
import {cellIssues,indexOutputIssues,issueSeverity} from '../src/lib/shopify/issue-index';
import {ShopifyOutputPreview} from '../src/components/tools/shopify-output-preview';
import {ShopifyIssueValue} from '../src/components/tools/shopify-issue-value';
import {canExport} from '../src/lib/shopify/validate';
import {exportShopifyCsv} from '../src/lib/shopify/export';
const source='title;sku;price;stock;image_url\nProduct;001;1,299;12.5;not-a-url\n;001;19.99;12;https://example.com/a.jpg\nNeutral;002;10;0;https://example.com/b.jpg';
function setup(){const csv=parseCsvText(source),result=transformSupplier(csv,suggestMappings(csv.columns));return {result,index:indexOutputIssues(result)};}
describe('Shopify validation presentation',()=>{
 it.each(['Price','Title','Inventory quantity','Product image URL'] as const)('maps %s errors to exact generated cells',field=>{const {index}=setup();const row=field==='Title'?2:1;expect(issueSeverity(cellIssues(index,row,field))).toBe('error');});
 it('maps duplicate SKUs as warnings without modifying their values',()=>{const {result,index}=setup();expect(issueSeverity(cellIssues(index,1,'SKU'))).toBe('warning');expect(result.rows[0].SKU).toBe('001');});
 it('exposes original validation explanations to keyboard and screen reader users',()=>{const {index}=setup();const issues=cellIssues(index,1,'Price');const html=renderToStaticMarkup(createElement(ShopifyIssueValue,{value:'1,299',issues,row:1,field:'Price'}));expect(html).toContain('type="button"');expect(html).toContain('aria-describedby=');expect(html).toContain('aria-invalid="true"');expect(html).toContain(issues[0].message);});
 it('neutral cells remain plain text without an error control',()=>{const {index}=setup();const issues=cellIssues(index,3,'Price');expect(issues).toEqual([]);const html=renderToStaticMarkup(createElement(ShopifyIssueValue,{value:'10',issues,row:3,field:'Price'}));expect(html).toBe('10');});
 it('indexing and rendering leave validation counts and blocked export unchanged',()=>{const {result}=setup();const before=JSON.stringify(result);const html=renderToStaticMarkup(createElement(ShopifyOutputPreview,{result}));expect(html).toContain('shopify-output-issue error');expect(html).toContain('shopify-output-issue warning');expect(JSON.stringify(result)).toBe(before);expect(canExport(result)).toBe(false);expect(()=>exportShopifyCsv(result,'x.csv')).toThrow();});
 it('issue filter identifies affected original row numbers',()=>{const {index}=setup();expect(index.affectedRows).toEqual([1,2]);});
 it('preserves multiple messages in one cell with error taking priority',()=>{const csv=parseCsvText('title,handle\nA,bad value\nB,bad value');const result=transformSupplier(csv,suggestMappings(csv.columns)),index=indexOutputIssues(result),issues=cellIssues(index,1,'URL handle');expect(issues.length).toBeGreaterThan(1);expect(issueSeverity(issues)).toBe('error');expect(issues.some(i=>i.type==='duplicate_handle')).toBe(true);});
 it('retains global field warnings and unmapped row notes',()=>{const csv=parseCsvText('title,Product category,parent_id\nA,Unknown,1\nB,Unknown,1');const result=transformSupplier(csv,suggestMappings(csv.columns)),index=indexOutputIssues(result);expect(cellIssues(index,2,'Product category')[0].type).toBe('category_review');expect(index.rowNotes.get(2)?.[0].type).toBe('possible_variant_rows');expect(index.affectedRows).toEqual([1,2]);});
 it('warning-only presentation leaves export available',()=>{const csv=parseCsvText('title,sku\nA,1\nB,1');const result=transformSupplier(csv,suggestMappings(csv.columns));indexOutputIssues(result);expect(canExport(result)).toBe(true);expect(exportShopifyCsv(result,'x.csv').rowCount).toBe(2);});
 it('indexes 10,000 affected rows without per-row scanning of all issues',()=>{const csv=parseCsvText('title,stock\n'+Array.from({length:10000},(_,i)=>'Product '+i+',bad').join('\n'));const result=transformSupplier(csv,suggestMappings(csv.columns));const start=performance.now(),index=indexOutputIssues(result);expect(index.affectedRows).toHaveLength(10000);expect(cellIssues(index,10000,'Inventory quantity')).toHaveLength(1);expect(performance.now()-start).toBeLessThan(1000);});
});

it('shows the complete long Unicode filename and its file size',()=>{const name='supplier_shopify_test_with_a_very_long_filename_Produktkatalog_München_Oktober_2026.csv';const file=new File(['abc'],name);const html=renderToStaticMarkup(createElement(SelectedFiles,{files:[file],onRemove:()=>{}}));expect(html).toContain('title="'+name+'"');expect(html).toContain('>'+name+'</strong>');expect(html).toContain('3 B');});

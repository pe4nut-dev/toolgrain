import {describe,it,expect} from 'vitest';
import Papa from 'papaparse';
import {parseCsvText} from '../src/lib/csv/parse-csv';
import {shopifyFields} from '../src/lib/shopify/fields';
import {suggestMappings} from '../src/lib/shopify/mapping';
import {generateHandle,uniqueHandles} from '../src/lib/shopify/handle';
import {parsePrice} from '../src/lib/shopify/price';
import {transformSupplier} from '../src/lib/shopify/transform';
import {canExport} from '../src/lib/shopify/validate';
import {exportShopifyCsv} from '../src/lib/shopify/export';
import {defaultOptions,type Mapping,type TransformOptions} from '../src/lib/shopify/types';
function run(text:string,mapping?:Mapping,options:Partial<TransformOptions>={}){const csv=parseCsvText(text);return {csv,result:transformSupplier(csv,mapping??suggestMappings(csv.columns),{...defaultOptions,...options})};}
function one(field:string,value:string){return run(Papa.unparse({fields:['title',field],data:[['Product',value]]}));}
describe('Shopify mapping and transformation',()=>{
 it('maps Title by German header and preserves original spelling',()=>{const {result}=run('artikelname,artikelnummer\nMünchen Mug,001234');expect(result.rows[0].Title).toBe('München Mug');expect(result.summary.mappedFields).toBe(2);});
 it('unmapped Title blocks export',()=>{const {result}=run('unknown,sku\nProduct,1');expect(canExport(result)).toBe(false);expect(result.issues.some(i=>i.type==='missing_title')).toBe(true);expect(()=>exportShopifyCsv(result,'x.csv')).toThrow();});
 it('empty Title lists affected rows and blocks export',()=>{const {result}=run('title,sku\n ,1\nValid,2');expect(result.issues.find(i=>i.type==='missing_title')?.rows).toEqual([1]);expect(canExport(result)).toBe(false);});
 it('generates simple title handles',()=>expect(generateHandle(' Coffee Mug ')).toBe('coffee-mug'));
 it('transliterates German and decomposed Unicode safely',()=>{expect(generateHandle('München Coffee Mug')).toBe('muenchen-coffee-mug');expect(generateHandle('Mu\u0308ller Straße')).toBe('mueller-strasse');});
 it('generated duplicates receive deterministic suffixes',()=>{const {result}=run('title\nProduct\nProduct\nProduct');expect(result.rows.map(r=>r['URL handle'])).toEqual(['product','product-2','product-3']);expect(result.issues.filter(i=>i.type==='handle_adjusted')).toHaveLength(2);});
 it('suffixes cannot collide with natural source handles',()=>expect(uniqueHandles(['product','product','product-2','product'])).toEqual(['product','product-3','product-2','product-4']));
 it('mapped duplicate handles block export and warn about variants',()=>{const {result}=run('title,handle\nA,same\nB,same');expect(canExport(result)).toBe(false);expect(result.issues.some(i=>i.type==='duplicate_handle')).toBe(true);expect(result.rows.map(r=>r['URL handle'])).toEqual(['same','same']);expect(result.issues.some(i=>i.type==='possible_variant_rows')).toBe(true);});
 it('explicit duplicate handle opt-in makes handles unique',()=>{const {result}=run('title,handle\nA,same\nB,same',undefined,{uniqueMappedHandles:true});expect(canExport(result)).toBe(true);expect(result.rows[1]['URL handle']).toBe('same-2');});
 it('mapped handles preserve original capitalization and are validated',()=>{expect(one('handle','Original-Handle').result.rows[0]['URL handle']).toBe('Original-Handle');expect(canExport(one('handle',' invalid ').result)).toBe(false);});
 it('mapped handles are checked case-insensitively for safety',()=>expect(canExport(run('title,handle\nA,Same\nB,same').result)).toBe(false));
 it('SKU preserves zeros, case and whitespace',()=>expect(one('sku',' 001234a ').result.rows[0].SKU).toBe(' 001234a '));
 it('Barcodes retain exact identifier strings including zeros and outer whitespace',()=>expect(one('ean',' 001234 ').result.rows[0].Barcodes).toBe(' 001234 '));
 it('valid integer stock is accepted',()=>{for(const v of ['0','12','54'])expect(canExport(one('stock',v).result)).toBe(true);});
 it.each(['12.5','-2','many',''])('invalid stock %s blocks export',v=>{expect(one('stock',v).result.issues.some(i=>i.type==='invalid_inventory')).toBe(true);expect(canExport(one('stock',v).result)).toBe(false);});
 it('valid HTTPS image syntax is accepted without fetching',()=>expect(canExport(one('image_url','https://example.com/mug.jpg').result)).toBe(true));
 it.each(['not a URL','javascript:alert(1)','https://','https://x.com/a b','https://user:pass@x.com/x'])('malformed/private-credential URL %s blocks export',v=>expect(canExport(one('image_url',v).result)).toBe(false));
 it('empty mapped image is nonblocking',()=>{const {result}=one('image_url','');expect(canExport(result)).toBe(true);expect(result.summary.warnings).toBe(1);});
 it('HTTP image receives HTTPS recommendation',()=>expect(one('image_url','http://example.com/a.jpg').result.summary.warnings).toBe(1));
 it('duplicate SKU warns and remains unchanged',()=>{const {result}=run('title,sku\nA,001\nB,001');expect(result.issues.find(i=>i.type==='duplicate_sku')?.rows).toEqual([1,2]);expect(canExport(result)).toBe(true);expect(result.rows.map(r=>r.SKU)).toEqual(['001','001']);});
 it('source product identifiers warn about possible variants',()=>expect(run('title,parent_id\nA,123\nB,123').result.issues.some(i=>i.type==='possible_variant_rows')).toBe(true));
 it('deeply frozen source rows remain unchanged',()=>{const {csv}=run('title,price,ean\nMünchen,19.99,001');const before=JSON.stringify(csv);csv.rows.forEach(Object.freeze);Object.freeze(csv.rows);const result=transformSupplier(csv,suggestMappings(csv.columns));exportShopifyCsv(result,'x.csv');expect(JSON.stringify(csv)).toBe(before);});
 it('defaults to draft and unpublished and allows configured defaults',()=>{const a=run('title\nA').result.rows[0];expect(a.Status).toBe('draft');expect(a['Published on online store']).toBe('false');expect(run('title\nA',undefined,{status:'active',published:true}).result.rows[0]).toMatchObject({Status:'active','Published on online store':'true'});});
 it('mapped status/published are validated and override defaults',()=>{expect(canExport(one('Status','invalid').result)).toBe(false);expect(canExport(one('Published on online store','yes').result)).toBe(false);expect(one('Status','ARCHIVED').result.rows[0].Status).toBe('archived');});
 it('ambiguous header candidates are not auto-selected',()=>{const {csv}=run('name,product_name,sku\nA,B,1');expect(suggestMappings(csv.columns).Title).toBeUndefined();});
 it('mapping arbitrary source columns manually works',()=>expect(run('custom\nA',{Title:'column_0'}).result.rows[0].Title).toBe('A'));
 it('invalid source mapping blocks export',()=>expect(canExport(run('title\nA',{Title:'bad'}).result)).toBe(false));
 it('warns about reused mapping columns',()=>expect(run('title\nA',{Title:'column_0',Vendor:'column_0'}).result.issues.some(i=>i.type==='reused_source')).toBe(true));
});
describe('conservative prices',()=>{
 it.each([['19,99','19.99'],['19.99','19.99'],['€19.99','19.99'],['19,99 €','19.99'],['1.299,00','1299.00'],['1,299.00','1299.00'],['0','0']])('parses %s without floating point conversion',(a,b)=>expect(parsePrice(a,'auto')).toEqual({value:b}));
 it.each(['1,299','1.299'])('ambiguous %s requires review',v=>expect(parsePrice(v,'auto').error).toContain('Ambiguous'));
 it('explicit format resolves ambiguous values',()=>{expect(parsePrice('1,299','point').value).toBe('1299');expect(parsePrice('1,299','comma').value).toBe('1.299');});
 it.each(['-19','USD19.99','19abc','1.29,00','1,2,3','1.00.00','€19$'])('rejects invalid %s',v=>expect(parsePrice(v,'auto').error).toBeTruthy());
 it('validates all monetary mappings independently',()=>{const {result}=run('title,price,uvp,ek\nA,invalid,invalid,invalid');expect(result.issues.filter(i=>i.severity==='error').map(i=>i.type)).toEqual(['invalid_price','invalid_compare_at_price','invalid_cost']);});
});
describe('Shopify export',()=>{
 it('uses supported current headers only',()=>{const {result}=run('title,sku,ean\nA,001,002');const report=exportShopifyCsv(result,'acme-products.csv'),csv=parseCsvText(report.csv);expect(csv.columns.map(c=>c.name)).toEqual(['Title','URL handle','Published on online store','Status','SKU','Barcodes']);expect(result.fields.every(f=>shopifyFields.includes(f))).toBe(true);expect(report.filename).toBe('acme-products-shopify.csv');});
 it('UTF-8, comma quoting and multiline descriptions roundtrip',()=>{const text='Müller, "Mug"\n東京';const {result}=run(Papa.unparse({fields:['title','description','sku'],data:[['München',text,'001']]}));const report=exportShopifyCsv(result,'Katalog März.csv');const decoded=new TextDecoder().decode(new TextEncoder().encode(report.csv));const csv=parseCsvText(decoded);expect(csv.delimiter).toBe(',');expect(csv.rows[0].column_2).toBe(text);expect(report.csv).not.toContain('\r\n');expect(report.csv.startsWith('Title,URL handle')).toBe(true);});
 it('blank optional fields are omitted instead of adding arbitrary headers',()=>{const {result}=run('title,ignore_me\nA,X');expect(result.fields).not.toContain('Description');expect(exportShopifyCsv(result,'x.csv').csv).not.toContain('ignore_me');});
 it('transforms and exports 10,000 products with unique generated handles',()=>{const csv=parseCsvText('title,sku,price,stock\n'+Array.from({length:10000},(_,i)=>'München Mug,00'+i+',19.99,12').join('\n'));const start=performance.now();const result=transformSupplier(csv,suggestMappings(csv.columns));const report=exportShopifyCsv(result,'supplier.csv');expect(result.summary.products).toBe(10000);expect(result.summary.errors).toBe(0);expect(new Set(result.rows.map(r=>r['URL handle'])).size).toBe(10000);expect(parseCsvText(report.csv).rows).toHaveLength(10000);expect(performance.now()-start).toBeLessThan(5000);});
});

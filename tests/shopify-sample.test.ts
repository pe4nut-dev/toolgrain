import {afterEach,describe,it,expect,vi} from 'vitest';
import {supplierSampleCsv,createSupplierSampleFile} from '../src/lib/shopify/sample';
import {parseCsvFile,parseCsvText} from '../src/lib/csv/parse-csv';
import {suggestMappings} from '../src/lib/shopify/mapping';
import {transformSupplier} from '../src/lib/shopify/transform';
import {createWorkingOutput,applyOutputEdit} from '../src/lib/shopify/working';
import {exportShopifyCsv} from '../src/lib/shopify/export';
import {canExport} from '../src/lib/shopify/validate';
import {defaultOptions} from '../src/lib/shopify/types';
import {fileSizeViolation,rowViolation} from '../src/lib/entitlements';

const sample=parseCsvText(supplierSampleCsv),mapping=suggestMappings(sample.columns);
function corrected(){
 let working=createWorkingOutput(transformSupplier(sample,mapping));
 for(const [row,field,value] of [[6,'Title','Maple Bookmark'],[11,'Title','Birch Pencil Case'],[8,'Price','16.90'],[9,'Inventory quantity','48']] as const)working=applyOutputEdit(working,row,field,value,defaultOptions);
 return working;
}
afterEach(()=>vi.unstubAllGlobals());
describe('bundled supplier sample through the real CSV pipeline',()=>{
 it('has 14 fictional products and all requested supplier columns',()=>{
  expect(sample.rows).toHaveLength(14);expect(sample.columns.map(column=>column.name)).toEqual(['Supplier SKU','Product name','Description','Price','Stock quantity','Supplier category']);
  expect(sample.rows.every(row=>row.column_2.startsWith('Fictional'))).toBe(true);
  expect(new Set(sample.rows.map(row=>row.column_5)).size).toBeGreaterThan(3);
 });
 it('loads a local File through the same FileReader/parser entry point as uploads',async()=>{
  class Reader {
   result:string|null=null;onload?:()=>void;onerror?:()=>void;onabort?:()=>void;
   readAsText(file:File){void file.text().then(text=>{this.result=text;this.onload?.();});}
   abort(){this.onabort?.();}
  }
  vi.stubGlobal('FileReader',Reader);
  const file=createSupplierSampleFile();expect(file.type).toContain('text/csv');expect(await parseCsvFile(file)).toEqual(sample);
 });
 it('suggests all sample mappings with category as Type, not taxonomy reconciliation',()=>{
  expect(mapping).toMatchObject({SKU:'column_0',Title:'column_1',Description:'column_2',Price:'column_3','Inventory quantity':'column_4',Type:'column_5'});
  expect(mapping['Product category']).toBeUndefined();
 });
 it('reports the deliberate missing titles, invalid price/stock and empty-price warning',()=>{
  const result=transformSupplier(sample,mapping);
  expect(result.issues.filter(issue=>issue.type==='missing_title').map(issue=>issue.rows)).toEqual([[6],[11]]);
  expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({type:'invalid_price',rows:[8]}),expect.objectContaining({type:'invalid_inventory',rows:[9]}),expect.objectContaining({type:'empty_price',severity:'warning',rows:[13]})]));
  expect(canExport(result)).toBe(false);expect(()=>exportShopifyCsv(result,'sample.csv')).toThrow();
 });
 it('inline corrections unlock export without changing source or baseline rows',()=>{
  const before=JSON.stringify(sample),working=corrected();
  expect(canExport(working.result)).toBe(true);expect(working.result.summary.errors).toBe(0);expect(working.edits).toBe(4);
  expect(working.baseline.rows[5].Title).toBe('');expect(JSON.stringify(sample)).toBe(before);
  expect(working.result.rows[5]['URL handle']).toBe('maple-bookmark');
 });
 it('exports and re-imports every SKU unchanged, including leading zeros and 30-digit identifiers',()=>{
  const result=corrected().result,report=exportShopifyCsv(result,'sample.csv'),reparsed=parseCsvText(report.csv);
  const skuKey=reparsed.columns.find(column=>column.name==='SKU')!.key;
  expect(reparsed.rows.map(row=>row[skuKey])).toEqual(sample.rows.map(row=>row.column_0));
  expect(reparsed.rows[0][skuKey]).toBe('00012345');expect(reparsed.rows[2][skuKey]).toBe('123456789012345678901234567890');expect(reparsed.rows[11][skuKey]).toBe('987654321098765432109876543210');
  expect(reparsed.rows.every(row=>typeof row[skuKey]==='string')).toBe(true);expect(report.csv).not.toMatch(/\d[eE][+-]\d|="|\t00012345/);
  expect(reparsed.rows).toHaveLength(14);
 });
 it('editing an identifier or another field preserves exact SKU and barcode strings',()=>{
  const csv=parseCsvText('title,sku,barcode\nTest,00012345, 000987654321098765432109876543210 ');
  const initial=createWorkingOutput(transformSupplier(csv,suggestMappings(csv.columns)));
  expect(initial.result.rows[0].Barcodes).toBe(' 000987654321098765432109876543210 ');
  const edited=applyOutputEdit(initial,1,'SKU','000000123456789012345678901234567890',defaultOptions);
  const titleEdited=applyOutputEdit(edited,1,'Title','New title',defaultOptions);
  const reimport=parseCsvText(exportShopifyCsv(titleEdited.result,'test.csv').csv);
  for(const field of ['SKU','Barcodes'] as const){const key=reimport.columns.find(column=>column.name===field)!.key;expect(reimport.rows[0][key]).toBe(titleEdited.result.rows[0][field]);}
  expect(titleEdited.result.rows[0].SKU).toBe('000000123456789012345678901234567890');
 });
 it('manual column remapping copies string values verbatim',()=>{
  const remapped=transformSupplier(sample,{...mapping,SKU:'column_2'});
  expect(remapped.rows.map(row=>row.SKU)).toEqual(sample.rows.map(row=>row.column_2));
 });
 it.each(['free','pro'] as const)('the sample fits %s limits without bypassing enforcement',plan=>{
  expect(rowViolation(plan,'supplier-csv-to-shopify',sample.rows.length)).toBeNull();expect(fileSizeViolation(plan,'supplier-csv-to-shopify',createSupplierSampleFile().size,'sample')).toBeNull();
  expect(rowViolation(plan,'supplier-csv-to-shopify',50001)).not.toBeNull();
 });
});

import {describe,it,expect} from 'vitest';
import {parseCsvText} from '../src/lib/csv/parse-csv';
import {suggestMappings} from '../src/lib/shopify/mapping';
import {transformSupplier} from '../src/lib/shopify/transform';
import {createWorkingOutput,applyOutputEdit,resetWorkingOutput} from '../src/lib/shopify/working';
import {defaultOptions} from '../src/lib/shopify/types';
import {indexOutputIssues} from '../src/lib/shopify/issue-index';
import {canExport} from '../src/lib/shopify/validate';
import {exportShopifyCsv} from '../src/lib/shopify/export';
function setup(text='title,price,stock,image_url,sku,handle\n,1.299,12.5,bad,1,duplicate\nB,10,0,https://example.com/b.jpg,1,duplicate'){const csv=parseCsvText(text),baseline=transformSupplier(csv,suggestMappings(csv.columns));return {csv,baseline,state:createWorkingOutput(baseline)};}
const edit=(s:ReturnType<typeof createWorkingOutput>,row:number,field:Parameters<typeof applyOutputEdit>[2],value:string)=>applyOutputEdit(s,row,field,value,defaultOptions);
describe('working Shopify corrections',()=>{
 it('fixes missing Title and removes its blocking error',()=>{const {state}=setup();const next=edit(state,1,'Title','Product');expect(next.result.rows[0].Title).toBe('Product');expect(next.result.issues.some(i=>i.type==='missing_title')).toBe(false);});
 it('corrects and normalizes monetary input',()=>{const {state}=setup();const next=edit(state,1,'Price','19,99');expect(next.result.rows[0].Price).toBe('19.99');expect(next.result.issues.some(i=>i.type==='invalid_price')).toBe(false);});
 it.each(['12.5','-1','many'])('keeps invalid inventory %s unresolved',value=>{const {state}=setup();expect(edit(state,1,'Inventory quantity',value).result.issues.some(i=>i.type==='invalid_inventory')).toBe(true);});
 it('resolves valid inventory',()=>{const {state}=setup();expect(edit(state,1,'Inventory quantity','12').result.issues.some(i=>i.type==='invalid_inventory')).toBe(false);});
 it('fixes image URL without fetching',()=>{const {state}=setup();expect(edit(state,1,'Product image URL','https://example.com/a.jpg').result.issues.some(i=>i.type==='invalid_image_url')).toBe(false);});
 it('recalculates duplicate SKU across rows',()=>{const {state}=setup();expect(edit(state,1,'SKU','2').result.issues.some(i=>i.type==='duplicate_sku')).toBe(false);});
 it('recalculates duplicate handles and does not suffix manual duplicates',()=>{const {state}=setup();const next=edit(state,1,'URL handle','unique');expect(next.result.issues.some(i=>i.type==='duplicate_handle')).toBe(false);const duplicate=edit(next,1,'URL handle','duplicate');expect(duplicate.result.rows[0]['URL handle']).toBe('duplicate');expect(duplicate.result.issues.some(i=>i.type==='duplicate_handle')).toBe(true);});
 it('regenerates generated handles on Title change',()=>{const {state}=setup('title\nA\nB');expect(edit(state,1,'Title','München').result.rows[0]['URL handle']).toBe('muenchen');});
 it('preserves manually overridden handles on Title change',()=>{const {state}=setup('title\nA\nB');const manual=edit(state,1,'URL handle','custom');expect(edit(manual,1,'Title','New title').result.rows[0]['URL handle']).toBe('custom');});
 it('updates counts and issue filter after resolution',()=>{const {state}=setup('title,stock\nA,bad\nB,0');const next=edit(state,1,'Inventory quantity','3');expect(next.result.summary.errors).toBe(0);expect(indexOutputIssues(next.result).affectedRows).toEqual([]);expect(canExport(next.result)).toBe(true);});
 it('exports corrected working values including Unicode',()=>{const {state}=setup('title\nA');const next=edit(state,1,'Title','Jäger München');expect(exportShopifyCsv(next.result,'x.csv').csv).toContain('Jäger München');});
 it('preserves original source, baseline and other rows',()=>{const {csv,baseline,state}=setup();const before=JSON.stringify({csv,baseline});const next=edit(state,1,'Title','Edited');expect(JSON.stringify({csv,baseline})).toBe(before);expect(next.result.rows[1]).toEqual(state.result.rows[1]);expect(next.result.rows[1]).not.toBe(state.result.rows[1]);});
 it('reset restores original mapped values and issues',()=>{const {state}=setup();const reset=resetWorkingOutput(edit(state,1,'Title','Fixed'));expect(reset.result).toEqual(state.baseline);expect(reset.edits).toBe(0);});
 it('does not reinterpret unresolved ambiguous prices after unrelated edits',()=>{const {state}=setup();const next=edit(state,1,'SKU','new');expect(next.result.rows[0].Price).toBe('1.299');expect(next.result.issues.some(i=>i.type==='invalid_price')).toBe(true);});
 it('preserves invalid price input and blocking errors',()=>{const {state}=setup();const next=edit(state,1,'Price','many');expect(next.result.rows[0].Price).toBe('many');expect(canExport(next.result)).toBe(false);});
 it('keeps 10,000 rows usable after a committed uniqueness edit',()=>{const {state}=setup('title,sku\n'+Array.from({length:10000},(_,i)=>'Product '+i+','+i).join('\n'));const start=performance.now();const next=edit(state,1,'SKU','updated');expect(next.result.rows.length).toBe(10000);expect(performance.now()-start).toBeLessThan(2000);});
});

it('preserves mapped handles after Title edit',()=>{const {state}=setup('title,handle\nA,mapped');expect(edit(state,1,'Title','New').result.rows[0]['URL handle']).toBe('mapped');});
it('keeps generated handles unique around manual overrides',()=>{const {state}=setup('title\nA\nB');const manual=edit(state,2,'URL handle','new');const next=edit(manual,1,'Title','New');expect(next.result.rows[0]['URL handle']).toBe('new-2');expect(next.result.rows[1]['URL handle']).toBe('new');});

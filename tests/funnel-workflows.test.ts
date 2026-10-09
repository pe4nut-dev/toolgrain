import {crmSampleCsv,compareOriginalSampleCsv,compareUpdatedSampleCsv} from '../src/lib/csv/sample-data';
/* eslint-disable @typescript-eslint/no-explicit-any -- Lightweight action harness inspects heterogeneous React props without adding a DOM dependency. */
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import * as React from 'react';
const harness=vi.hoisted(()=>({states:[] as any[],refs:[] as any[],cursor:0,refCursor:0,plan:'free' as 'free'|'pro',submit:null as any,parse:vi.fn(),crmDownload:vi.fn(),compareDownload:vi.fn(),shopifyDownload:vi.fn(),checkout:vi.fn()}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:any)=>{
 const index=harness.cursor++;if(!(index in harness.states))harness.states[index]=typeof initial==='function'?initial():initial;
 return [harness.states[index],(next:any)=>{harness.states[index]=typeof next==='function'?next(harness.states[index]):next;}];
},useRef:(initial:any)=>{const index=harness.refCursor++;return harness.refs[index]??(harness.refs[index]={current:initial});},useId:()=> 'cell-test',useLayoutEffect:()=>{},useEffect:()=>{},useMemo:(fn:()=>unknown)=>fn(),useActionState:(action:any)=>{harness.submit=action;return [{},action,false];}}));
vi.mock('../src/components/auth/account-provider',()=>({useAccount:()=>({plan:harness.plan,signedIn:false})}));
vi.mock('../src/lib/csv/parse-csv',async original=>({...await original<typeof import('../src/lib/csv/parse-csv')>(),parseCsvFile:harness.parse}));
vi.mock('../src/lib/crm/clean/export-csv',()=>({downloadCleanedCsv:harness.crmDownload}));
vi.mock('../src/lib/csv-compare/export-csv',async original=>({...await original<typeof import('../src/lib/csv-compare/export-csv')>(),downloadComparisonExport:harness.compareDownload}));
vi.mock('../src/lib/shopify/export',()=>({downloadShopifyCsv:harness.shopifyDownload}));
vi.mock('../src/app/billing/actions',()=>({checkoutAction:harness.checkout}));
vi.mock('next/navigation',()=>({usePathname:()=>'/'}));
import {parseCsvText} from '../src/lib/csv/parse-csv';
import {compareCsv} from '../src/lib/csv-compare/compare-csv';
import {CRMCSVCleaner} from '../src/components/tools/apps/crm-csv-cleaner';
import {CSVCompare} from '../src/components/tools/apps/csv-compare';
import {SupplierCSVToShopify} from '../src/components/tools/apps/supplier-csv-to-shopify';
import {CrmCleaningWorkflow} from '../src/components/tools/crm-cleaning-workflow';
import {CsvCompareResult} from '../src/components/tools/csv-compare-result';
import {FileDropzone} from '../src/components/tools/file-dropzone';
import {ShopifyOutputPreview} from '../src/components/tools/shopify-output-preview';
import {UpgradePrompt} from '../src/components/tools/upgrade-prompt';
import {UpgradeLink} from '../src/components/analytics/upgrade-link';
import {BillingButtons} from '../src/components/pricing/billing-buttons';
import {rowViolation} from '../src/lib/entitlements';
import {Header} from '../src/components/layout/header';
import {SelectedFiles} from '../src/components/tools/selected-files';
import {supplierSampleCsv} from '../src/lib/shopify/sample';
import {ShopifyEditCell} from '../src/components/tools/shopify-edit-cell';
import {ShopifyIssueValue} from '../src/components/tools/shopify-issue-value';
import {transformSupplier} from '../src/lib/shopify/transform';
import {suggestMappings} from '../src/lib/shopify/mapping';

const track=vi.fn(),navigate=vi.fn();
const privateFile={name:'private-contact-data.csv',size:100} as File;
const csv=parseCsvText('id,title,email\n1,Product,private@example.com');
function render(fn:()=>any){harness.cursor=0;harness.refCursor=0;return fn();}
function nodes(value:any):any[]{
 if(!value||typeof value!=='object')return [];
 if(Array.isArray(value))return value.flatMap(nodes);
 if(!value.props)return [];
 return [value,...Object.values(value.props).flatMap(nodes)];
}
function element(tree:any,type:any){const found=nodes(tree).find(node=>node.type===type);expect(found).toBeDefined();return found;}
function button(tree:any,label:string){const found=nodes(tree).find(node=>node.type==='button'&&JSON.stringify(node.props.children).includes(label));expect(found).toBeDefined();return found;}
async function flush(){await Promise.resolve();await Promise.resolve();}
beforeEach(()=>{
 harness.states=[];harness.refs=[];harness.cursor=0;harness.refCursor=0;harness.plan='free';harness.submit=null;
 vi.clearAllMocks();harness.parse.mockResolvedValue(csv);harness.crmDownload.mockReset();harness.compareDownload.mockReset();harness.shopifyDownload.mockReset();
 vi.stubGlobal('React',React);vi.stubGlobal('window',{umami:{track},location:{assign:navigate}});
});
afterEach(()=>vi.unstubAllGlobals());
describe('tool workflow actions, not render or file-selection events',()=>{
 it('sample uses the upload parser and existing mapping/correction/export workflow without selection events',async()=>{
  harness.parse.mockImplementation(async(file:File)=>parseCsvText(await file.text()));
  button(render(SupplierCSVToShopify),'Try with sample CSV').props.onClick();
  // File.text() is asynchronous; await the exact parse invocation before rendering its result.
  await harness.parse.mock.results[0].value;await flush();
  expect(harness.parse).toHaveBeenCalledWith(expect.any(File),expect.any(AbortSignal));expect(track).not.toHaveBeenCalled();
  expect(JSON.stringify(render(SupplierCSVToShopify))).toContain('Fictional sample data');
  const mapped=nodes(render(SupplierCSVToShopify)).find(node=>node.props['aria-label']==='Map SKU');expect(mapped.props.value).toBe('column_0');
  button(render(SupplierCSVToShopify),'Validate and preview').props.onClick();
  expect(track).toHaveBeenCalledExactlyOnceWith('tool_started',{tool:'supplier-shopify',plan:'free'});
  expect(button(render(SupplierCSVToShopify),'Download Shopify CSV').props.disabled).toBe(true);
  for(const [row,field,value] of [[6,'Title','Maple Bookmark'],[11,'Title','Birch Pencil Case'],[8,'Price','16.90'],[9,'Inventory quantity','48']])element(render(SupplierCSVToShopify),ShopifyOutputPreview).props.onEdit(row,field,value);
  expect(track).toHaveBeenLastCalledWith('tool_completed',{tool:'supplier-shopify',plan:'free'});
  button(render(SupplierCSVToShopify),'Download Shopify CSV').props.onClick();
  expect(track).toHaveBeenLastCalledWith('export_clicked',{tool:'supplier-shopify',plan:'free'});
  expect(harness.shopifyDownload.mock.calls[0][0].rows[0].SKU).toBe('00012345');
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/SKU|Product|00012345|\.csv|fictional/);
 });
 it('a real upload replaces sample status, mappings and results',async()=>{
  harness.parse.mockResolvedValue(parseCsvText(supplierSampleCsv));
  button(render(SupplierCSVToShopify),'Try with sample CSV').props.onClick();await flush();button(render(SupplierCSVToShopify),'Validate and preview').props.onClick();
  harness.parse.mockResolvedValue(parseCsvText('name,sku\nReal file,00999'));
  element(render(SupplierCSVToShopify),FileDropzone).props.onFilesSelected([privateFile]);await flush();
  const tree=render(SupplierCSVToShopify);expect(JSON.stringify(tree)).not.toContain('Fictional sample data');
  expect(element(tree,SelectedFiles).props.files[0]).toBe(privateFile);
  expect(nodes(tree).some(node=>node.type===ShopifyOutputPreview)).toBe(false);
  expect(nodes(tree).find(node=>node.props['aria-label']==='Map SKU').props.value).toBe('column_1');
 });
 it('sample can be removed and loaded afresh without conversion events',async()=>{
  harness.parse.mockResolvedValue(parseCsvText(supplierSampleCsv));button(render(SupplierCSVToShopify),'Try with sample CSV').props.onClick();await flush();
  element(render(SupplierCSVToShopify),SelectedFiles).props.onRemove(0);
  expect(JSON.stringify(render(SupplierCSVToShopify))).not.toContain('Fictional sample data');expect(button(render(SupplierCSVToShopify),'Validate and preview').props.disabled).toBe(true);
  button(render(SupplierCSVToShopify),'Try with sample CSV').props.onClick();await flush();expect(JSON.stringify(render(SupplierCSVToShopify))).toContain('Fictional sample data');expect(track).not.toHaveBeenCalled();
 });
 it.each(['free','pro'] as const)('replacing the sample with an over-limit upload remains blocked on %s',async plan=>{
  harness.plan=plan;harness.parse.mockResolvedValue(parseCsvText(supplierSampleCsv));button(render(SupplierCSVToShopify),'Try with sample CSV').props.onClick();await flush();
  harness.parse.mockResolvedValue({...csv,rows:Array(plan==='free'?101:10001).fill(csv.rows[0])});
  element(render(SupplierCSVToShopify),FileDropzone).props.onFilesSelected([privateFile]);await flush();
  const tree=render(SupplierCSVToShopify);expect(button(tree,'Validate and preview').props.disabled).toBe(true);expect(nodes(tree).some(node=>node.type===UpgradePrompt)).toBe(true);expect(track).not.toHaveBeenCalled();
 });
 it('CRM starts on Analyze, completes after results and exports without uploaded data',async()=>{
  element(render(CRMCSVCleaner),FileDropzone).props.onFilesSelected([privateFile]);expect(track).not.toHaveBeenCalled();
  await button(render(CRMCSVCleaner),'Analyze CSV').props.onClick();
  expect(track.mock.calls).toEqual([['tool_started',{tool:'crm-cleaner',plan:'free'}],['tool_completed',{tool:'crm-cleaner',plan:'free'}]]);
  render(CRMCSVCleaner);expect(track).toHaveBeenCalledTimes(2);
  const workflow=element(render(CRMCSVCleaner),CrmCleaningWorkflow);
  harness.states=[];harness.refs=[];
  button(render(()=>CrmCleaningWorkflow(workflow.props)),'Download').props.onClick();
  expect(harness.crmDownload).toHaveBeenCalledOnce();expect(track).toHaveBeenLastCalledWith('export_clicked',{tool:'crm-cleaner',plan:'free'});
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/private|\.csv|email|id/);
 });
 it.each(['failure','limit'])('CRM has no completion on %s',async kind=>{
  if(kind==='failure')harness.parse.mockRejectedValue(Error('private failure'));
  else harness.parse.mockResolvedValue({...csv,rows:Array(501).fill(csv.rows[0])});
  element(render(CRMCSVCleaner),FileDropzone).props.onFilesSelected([privateFile]);
  await button(render(CRMCSVCleaner),'Analyze CSV').props.onClick();
  expect(track.mock.calls).toEqual([['tool_started',{tool:'crm-cleaner',plan:'free'}]]);
 });
 it('CSV Compare waits for Compare, then completes and exports the report',async()=>{
  for(const zone of nodes(render(CSVCompare)).filter(node=>node.type===FileDropzone)){zone.props.onFilesSelected([privateFile]);await flush();}
  const tree=render(CSVCompare);
  for(const select of nodes(tree).filter(node=>node.type==='select'))select.props.onChange({target:{value:csv.columns[0].key}});
  expect(track).not.toHaveBeenCalled();button(render(CSVCompare),'Compare CSVs').props.onClick();
  expect(track.mock.calls).toEqual([['tool_started',{tool:'csv-compare',plan:'free'}],['tool_completed',{tool:'csv-compare',plan:'free'}]]);
  const result=element(render(CSVCompare),CsvCompareResult);
  // Make one added record to enable an actual export in the result component.
  const props={...result.props,result:{...result.props.result,added:[{key:'2',row:csv.rows[0],rowNumber:1}]}};
  harness.states=[];harness.refs=[];
  button(render(()=>CsvCompareResult(props)),'added').props.onClick();
  expect(harness.compareDownload).toHaveBeenCalledOnce();expect(track).toHaveBeenLastCalledWith('export_clicked',{tool:'csv-compare',plan:'free'});
 });
 it.each(['failure','limit'])('CSV Compare cannot complete on %s',async kind=>{
  if(kind==='failure')harness.parse.mockRejectedValue(Error('private failure'));else harness.parse.mockResolvedValue({...csv,rows:Array(501).fill(csv.rows[0])});
  for(const zone of nodes(render(CSVCompare)).filter(node=>node.type===FileDropzone)){zone.props.onFilesSelected([privateFile]);await flush();}
  const action=button(render(CSVCompare),'Compare CSVs');expect(action.props.disabled).toBe(true);action.props.onClick();expect(track).not.toHaveBeenCalled();
 });
 it('Shopify starts only on preview and completes when export is usable',async()=>{
  element(render(SupplierCSVToShopify),FileDropzone).props.onFilesSelected([privateFile]);await flush();expect(track).not.toHaveBeenCalled();
  button(render(SupplierCSVToShopify),'Validate and preview').props.onClick();
  expect(track.mock.calls).toEqual([['tool_started',{tool:'supplier-shopify',plan:'free'}],['tool_completed',{tool:'supplier-shopify',plan:'free'}]]);
  button(render(SupplierCSVToShopify),'Download Shopify CSV').props.onClick();
  expect(track).toHaveBeenLastCalledWith('export_clicked',{tool:'supplier-shopify',plan:'free'});
 });
 it('Shopify invalid output completes only once after the inline fix makes it usable',async()=>{
  harness.parse.mockResolvedValue(parseCsvText('title,sku\n ,1'));
  element(render(SupplierCSVToShopify),FileDropzone).props.onFilesSelected([privateFile]);await flush();
  button(render(SupplierCSVToShopify),'Validate and preview').props.onClick();expect(track).toHaveBeenCalledExactlyOnceWith('tool_started',{tool:'supplier-shopify',plan:'free'});
  expect(button(render(SupplierCSVToShopify),'Download Shopify CSV').props.disabled).toBe(true);
  element(render(SupplierCSVToShopify),ShopifyOutputPreview).props.onEdit(1,'Title','Fixed');
  expect(track).toHaveBeenLastCalledWith('tool_completed',{tool:'supplier-shopify',plan:'free'});
  element(render(SupplierCSVToShopify),ShopifyOutputPreview).props.onEdit(1,'Title','Still fixed');expect(track).toHaveBeenCalledTimes(2);
 });
 it.each(['failure','limit'])('Shopify has no completion on %s',async kind=>{
  if(kind==='failure')harness.parse.mockRejectedValue(Error('private failure'));else harness.parse.mockResolvedValue({...csv,rows:Array(101).fill(csv.rows[0])});
  element(render(SupplierCSVToShopify),FileDropzone).props.onFilesSelected([privateFile]);await flush();
  const action=button(render(SupplierCSVToShopify),'Validate and preview');expect(action.props.disabled).toBe(true);action.props.onClick();expect(track).not.toHaveBeenCalled();
 });
 it('failed Shopify downloads do not produce export events',async()=>{
  element(render(SupplierCSVToShopify),FileDropzone).props.onFilesSelected([privateFile]);await flush();button(render(SupplierCSVToShopify),'Validate and preview').props.onClick();track.mockClear();
  harness.shopifyDownload.mockImplementation(()=>{throw Error('private');});button(render(SupplierCSVToShopify),'Download Shopify CSV').props.onClick();expect(track).not.toHaveBeenCalled();
 });
 it('uses the read-only current Pro plan for successful processing',async()=>{
  harness.plan='pro';element(render(CRMCSVCleaner),FileDropzone).props.onFilesSelected([privateFile]);await button(render(CRMCSVCleaner),'Analyze CSV').props.onClick();
  expect(track).toHaveBeenLastCalledWith('tool_completed',{tool:'crm-cleaner',plan:'pro'});
 });
});
describe('Shopify UI polish',()=>{
 const parsed=parseCsvText(supplierSampleCsv),result=transformSupplier(parsed,suggestMappings(parsed.columns));
 it('collapses loaded files and does not repeat the active sample action',async()=>{
  harness.parse.mockResolvedValue(parsed);button(render(SupplierCSVToShopify),'Try with sample CSV').props.onClick();await flush();
  const tree=render(SupplierCSVToShopify);expect(element(tree,FileDropzone).props.compactContent).toBeTruthy();
  expect(nodes(tree).filter(node=>node.type==='button'&&node.props.children==='Try with sample CSV')).toHaveLength(0);
 });
 it('filters error and warning rows independently and restores all rows',()=>{
  const preview=()=>ShopifyOutputPreview({result});
  button(render(preview),'Rows with errors').props.onClick();expect(nodes(render(preview)).filter(node=>node.props['data-row']).map(node=>node.props['data-row'])).toEqual([6,8,9,11]);
  button(render(preview),'Rows with warnings').props.onClick();expect(nodes(render(preview)).filter(node=>node.props['data-row']).map(node=>node.props['data-row'])).toEqual([6,11,13]);
  button(render(preview),'All rows').props.onClick();expect(nodes(render(preview)).filter(node=>node.props['data-row'])).toHaveLength(14);
 });
 it('review-blocking action selects errors without allowing export',async()=>{
  harness.parse.mockResolvedValue(parsed);button(render(SupplierCSVToShopify),'Try with sample CSV').props.onClick();await flush();button(render(SupplierCSVToShopify),'Validate and preview').props.onClick();
  vi.stubGlobal('requestAnimationFrame',()=>{});button(render(SupplierCSVToShopify),'Review blocking issues').props.onClick();
  const tree=render(SupplierCSVToShopify);expect(element(tree,ShopifyOutputPreview).props.filter).toBe('error');expect(button(tree,'Download Shopify CSV').props.disabled).toBe(true);
 });
 it('next issue opens the relevant cell editor, scrolls to it and wraps through the current filter',()=>{
  const preview=()=>ShopifyOutputPreview({result,filter:'error',onEdit:vi.fn(()=>[])});const focus=vi.fn(),scroll=vi.fn(),cellQuery=vi.fn(()=>({focus})),fieldQuery=vi.fn((selector:string)=>selector?{querySelector:cellQuery,scrollIntoView:scroll}:null),query=vi.fn((selector:string)=>selector?{querySelector:fieldQuery}:null);
  vi.stubGlobal('requestAnimationFrame',(callback:()=>void)=>callback());render(preview);harness.refs[0].current={querySelector:query};
  for(let i=0;i<5;i++)button(render(preview),'Next issue').props.onClick();
  expect(query.mock.calls.map(call=>call[0])).toEqual(['[data-row="6"]','[data-row="8"]','[data-row="9"]','[data-row="11"]','[data-row="6"]']);expect(focus).toHaveBeenCalledTimes(5);
  expect(fieldQuery.mock.calls.map(call=>call[0])).toEqual(['[data-field="Title"]','[data-field="Price"]','[data-field="Inventory quantity"]','[data-field="Title"]','[data-field="Title"]']);
  const editors=nodes(render(preview)).filter(node=>node.type===ShopifyEditCell&&node.props.editing);
  expect(editors).toHaveLength(1);expect(editors[0].props).toMatchObject({row:6,field:'Title'});expect(scroll).toHaveBeenCalledTimes(5);
 });
 it('next issue visits separate error cells within the same row without saving drafts',()=>{
  const issues=result.issues.filter(issue=>issue.type==='missing_title').slice(0,1).concat([{type:'invalid_price',severity:'error',rows:[6],field:'Price',message:'Review price.'}]);
  const onEdit=vi.fn(()=>[]),preview=()=>ShopifyOutputPreview({result:{...result,issues},filter:'error',onEdit});
  vi.stubGlobal('requestAnimationFrame',()=>{});
  button(render(preview),'Next issue').props.onClick();expect(nodes(render(preview)).find(node=>node.type===ShopifyEditCell&&node.props.editing)?.props.field).toBe('Title');
  button(render(preview),'Next issue').props.onClick();expect(nodes(render(preview)).find(node=>node.type===ShopifyEditCell&&node.props.editing)?.props.field).toBe('Price');expect(onEdit).not.toHaveBeenCalled();
 });
 it('Enter saves the exact identifier string; Escape cancels without saving',()=>{
  const onApply=vi.fn(()=>[]),onClose=vi.fn(),props={value:'00012345',issues:[],row:1,field:'SKU' as const,onApply,editing:true,onOpen:vi.fn(),onClose};
  vi.stubGlobal('requestAnimationFrame',()=>{});
  element(render(()=>ShopifyEditCell(props)),'input').props.onChange({target:{value:'000000123456789012345678901234567890'}});
  element(render(()=>ShopifyEditCell(props)),'input').props.onKeyDown({key:'Enter',nativeEvent:{isComposing:false},preventDefault:vi.fn()});
  expect(onApply).toHaveBeenCalledExactlyOnceWith('000000123456789012345678901234567890');
  element(render(()=>ShopifyEditCell(props)),'input').props.onKeyDown({key:'Escape'});expect(onApply).toHaveBeenCalledOnce();expect(onClose).toHaveBeenCalledTimes(2);
 });
 it('IME Enter does not commit an unfinished value',()=>{
  const onApply=vi.fn(()=>[]);const tree=render(()=>ShopifyEditCell({value:'00012345',issues:[],row:1,field:'SKU',onApply,editing:true,onOpen:vi.fn(),onClose:vi.fn()}));
  element(tree,'input').props.onKeyDown({key:'Enter',nativeEvent:{isComposing:true},preventDefault:vi.fn()});expect(onApply).not.toHaveBeenCalled();
 });
 it('switching to a different cell opens it without committing a draft',()=>{
  const onApply=vi.fn(()=>[]),onOpen=vi.fn();const tree=render(()=>ShopifyEditCell({value:'00012345',issues:[],row:2,field:'SKU',onApply,editing:false,onOpen,onClose:vi.fn()}));
  element(tree,'button').props.onClick();expect(onOpen).toHaveBeenCalledOnce();expect(onApply).not.toHaveBeenCalled();
 });
 it('long descriptions expose their complete original text through a keyboard-accessible disclosure',()=>{
  const value='Long fictional description '.repeat(30);const tree=render(()=>ShopifyIssueValue({value,issues:[],row:1,field:'Description'}));
  expect(tree.type).toBe('details');expect(element(tree,'p').props.children).toBe(value);expect(element(tree,'summary').props['aria-label']).toBe('Read full Description in row 1');
 });
});
describe('explicit upgrade and confirmed checkout actions',()=>{
 it('limit upgrade includes tool context without the filename or counts',()=>{
  const usage=rowViolation('free','crm-csv-cleaner',501,privateFile.name)!;
  const link=nodes(render(()=>UpgradePrompt({usage}))).find(node=>node.props.href==='/pricing');link.props.onClick();
  expect(track).toHaveBeenCalledExactlyOnceWith('upgrade_clicked',{tool:'crm-cleaner',plan:'free'});
 });
 it('account upgrade has no invented attribution',()=>{render(UpgradeLink).props.onClick();expect(track).toHaveBeenCalledExactlyOnceWith('upgrade_clicked',{plan:'free'});});
 it('ordinary header pricing navigation has no upgrade tracking',()=>{
  const tree=render(Header);const links=nodes(tree).filter(node=>node.props.href==='/pricing');expect(links.length).toBeGreaterThan(0);
  for(const link of links)link.props.onClick?.();expect(track).not.toHaveBeenCalled();
 });
 it('logged-out sign-in-to-upgrade click is upgrade intent only',()=>{
  render(()=>BillingButtons({signedIn:false,plan:'free',available:true})).props.onClick();expect(track).toHaveBeenCalledExactlyOnceWith('upgrade_clicked',{plan:'free'});
 });
 it('checkout is not counted until the successful server response',async()=>{
  let resolve!:(result:unknown)=>void;harness.checkout.mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const tree=render(()=>BillingButtons({signedIn:true,plan:'free',available:true}));tree.props.onSubmit();
  const form=new FormData();form.set('cycle','monthly');const pending=harness.submit({},form);
  expect(track.mock.calls).toEqual([['upgrade_clicked',{plan:'free'}]]);expect(navigate).not.toHaveBeenCalled();
  resolve({checkoutUrl:'https://checkout.stripe.com/private'});await pending;
  expect(track).toHaveBeenLastCalledWith('checkout_started',{plan:'free'});expect(navigate).toHaveBeenCalledOnce();
 });
 it('failed checkout has no checkout_started event',async()=>{
  harness.checkout.mockResolvedValue({error:'Unavailable'});render(()=>BillingButtons({signedIn:true,plan:'free',available:true}));await harness.submit({},new FormData());expect(track).not.toHaveBeenCalled();expect(navigate).not.toHaveBeenCalled();
 });
});

describe('CRM and Compare sample UI workflows',()=>{
 it('CRM sample selection is idle until Analyze and uses the same parser',async()=>{
  button(render(CRMCSVCleaner),'Try with sample CSV').props.onClick();
  expect(harness.parse).not.toHaveBeenCalled();expect(track).not.toHaveBeenCalled();
  expect(JSON.stringify(render(CRMCSVCleaner))).toContain('Fictional sample data');
  harness.parse.mockResolvedValue(parseCsvText(crmSampleCsv));
  await button(render(CRMCSVCleaner),'Analyze CSV').props.onClick();
  expect(harness.parse.mock.calls[0][0]).toBeInstanceOf(File);
  expect(track.mock.calls).toEqual([['tool_started',{tool:'crm-cleaner',plan:'free'}],['tool_completed',{tool:'crm-cleaner',plan:'free'}]]);
  expect(element(render(CRMCSVCleaner),CrmCleaningWorkflow).props.session.originalCsv.rows).toHaveLength(20);
 });
 it('CRM sample replacement clears demo status and review, and Remove resets the file',async()=>{
  button(render(CRMCSVCleaner),'Try with sample CSV').props.onClick();harness.parse.mockResolvedValue(parseCsvText(crmSampleCsv));
  await button(render(CRMCSVCleaner),'Analyze CSV').props.onClick();
  element(render(CRMCSVCleaner),FileDropzone).props.onFilesSelected([privateFile]);
  expect(JSON.stringify(render(CRMCSVCleaner))).not.toContain('Fictional sample data');
  expect(nodes(render(CRMCSVCleaner)).some(node=>node.type===CrmCleaningWorkflow)).toBe(false);
  button(render(CRMCSVCleaner),'Remove').props.onClick();
  expect(button(render(CRMCSVCleaner),'Analyze CSV').props.disabled).toBe(true);expect(track).toHaveBeenCalledTimes(2);
 });
 it('Compare loads both samples via the parser and requires a selected key without tracking load',async()=>{
  harness.parse.mockImplementation(async(file:File)=>parseCsvText(await file.text()));
  button(render(CSVCompare),'Try with sample files').props.onClick();
  await Promise.all(harness.parse.mock.results.map(result=>result.value));await flush();
  expect(harness.parse).toHaveBeenCalledTimes(2);expect(track).not.toHaveBeenCalled();
  let tree=render(CSVCompare);expect(button(tree,'Compare CSVs').props.disabled).toBe(true);
  expect(nodes(tree).filter(node=>node.type===SelectedFiles)).toHaveLength(2);
  nodes(tree).find(node=>node.type==='select'&&node.props['aria-label']==='Old file key').props.onChange({target:{value:'column_0'}});
  tree=render(CSVCompare);expect(button(tree,'Compare CSVs').props.disabled).toBe(false);
  button(tree,'Compare CSVs').props.onClick();
  const result=element(render(CSVCompare),CsvCompareResult).props.result;
  expect(result.changed).toHaveLength(3);expect(result.unchanged).toHaveLength(14);
  expect(track.mock.calls).toEqual([['tool_started',{tool:'csv-compare',plan:'free'}],['tool_completed',{tool:'csv-compare',plan:'free'}]]);
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/\.csv|sku|example|0000/);
 });
 it('Compare replaces either sample independently and supports removing both files',async()=>{
  harness.parse.mockResolvedValue(parseCsvText(compareOriginalSampleCsv));
  button(render(CSVCompare),'Try with sample files').props.onClick();await flush();
  const zones=nodes(render(CSVCompare)).filter(node=>node.type===FileDropzone);
  zones[0].props.onFilesSelected([privateFile]);await flush();
  let selected=nodes(render(CSVCompare)).filter(node=>node.type===SelectedFiles);
  expect(selected[0].props.files[0]).toBe(privateFile);
  expect(JSON.stringify(selected[0])).not.toContain('Fictional sample data');
  expect(JSON.stringify(selected[1])).toContain('Fictional sample data');
  button(render(CSVCompare),'Remove both files').props.onClick();
  selected=nodes(render(CSVCompare)).filter(node=>node.type===SelectedFiles);expect(selected).toHaveLength(0);expect(track).not.toHaveBeenCalled();
 });
 it('Compare All filter shows separate categories and filters back to Added',()=>{
  const oldCsv=parseCsvText(compareOriginalSampleCsv),newCsv=parseCsvText(compareUpdatedSampleCsv);
  const result=compareCsv(oldCsv,newCsv,'column_0','column_0');
  const component=()=>CsvCompareResult({result,oldCsv,newCsv,oldFilename:'old.csv',newFilename:'new.csv'});
  button(render(component),'All').props.onClick();
  const all=render(component);expect(button(all,'All').props['aria-pressed']).toBe(true);
  expect(nodes(all).some(node=>node.props['aria-label']==='Added rows')).toBe(true);
  expect(nodes(all).some(node=>node.props['aria-label']==='Removed rows')).toBe(true);
  button(all,'Added').props.onClick();
  const added=render(component);expect(button(added,'Added').props['aria-pressed']).toBe(true);
  expect(nodes(added).some(node=>node.props['aria-label']==='Removed rows')).toBe(false);
 });
});
describe('comparison detail accessibility',()=>{
 it('shows full shared row context, labeled changed cells and unchanged values separately',()=>{
  const oldCsv=parseCsvText(compareOriginalSampleCsv),newCsv=parseCsvText(compareUpdatedSampleCsv);
  const result=compareCsv(oldCsv,newCsv,'column_0','column_0');
  const root=render(()=>CsvCompareResult({result,oldCsv,newCsv,oldFilename:'old.csv',newFilename:'new.csv'}));
  const detail=nodes(root).find(node=>typeof node.type==='function'&&node.type.name==='ChangedRecordComparison');
  harness.states=[];harness.refs=[];
  const component=()=>detail.type(detail.props);
  const collapsed=render(component);collapsed.props.onToggle({currentTarget:{open:true}});
  const expanded=render(component);
  expect(nodes(expanded).filter(node=>node.type==='td'&&node.props.className==='changed-value')).toHaveLength(2);
  expect(nodes(expanded).filter(node=>node.type==='th'&&node.props.scope==='row')).toHaveLength(6);
  expect(JSON.stringify(expanded)).toContain('Changed');
  expect(JSON.stringify(expanded)).toContain('00000002');
  expect(nodes(expanded).some(node=>node.props.role==='region'&&node.props.tabIndex===0)).toBe(true);
 });
 it('expands long visible text without changing or losing the original cell value',()=>{
  const long='Very long description '.repeat(20);
  const oldCsv=parseCsvText('sku,description\n0001,'+long),newCsv=parseCsvText('sku,description\n0001,'+long+'new');
  const result=compareCsv(oldCsv,newCsv,'column_0','column_0');
  const root=render(()=>CsvCompareResult({result,oldCsv,newCsv,oldFilename:'old.csv',newFilename:'new.csv'}));
  const detail=nodes(root).find(node=>typeof node.type==='function'&&node.type.name==='ChangedRecordComparison');
  harness.states=[];harness.refs=[];const component=()=>detail.type(detail.props);
  render(component).props.onToggle({currentTarget:{open:true}});
  const expanded=render(component);
  expect(nodes(expanded).filter(node=>node.type==='details'&&node.props.className==='compare-long-value')).toHaveLength(2);
  expect(nodes(expanded).some(node=>node.type==='p'&&node.props.children===long)).toBe(true);
 });
});
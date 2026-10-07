/* eslint-disable @typescript-eslint/no-explicit-any -- Lightweight action harness inspects heterogeneous React props without adding a DOM dependency. */
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import * as React from 'react';
const harness=vi.hoisted(()=>({states:[] as any[],refs:[] as any[],cursor:0,refCursor:0,plan:'free' as 'free'|'pro',submit:null as any,parse:vi.fn(),crmDownload:vi.fn(),compareDownload:vi.fn(),shopifyDownload:vi.fn(),checkout:vi.fn()}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:any)=>{
 const index=harness.cursor++;if(!(index in harness.states))harness.states[index]=typeof initial==='function'?initial():initial;
 return [harness.states[index],(next:any)=>{harness.states[index]=typeof next==='function'?next(harness.states[index]):next;}];
},useRef:(initial:any)=>{const index=harness.refCursor++;return harness.refs[index]??(harness.refs[index]={current:initial});},useEffect:()=>{},useMemo:(fn:()=>unknown)=>fn(),useActionState:(action:any)=>{harness.submit=action;return [{},action,false];}}));
vi.mock('../src/components/auth/account-provider',()=>({useAccount:()=>({plan:harness.plan,signedIn:false})}));
vi.mock('../src/lib/csv/parse-csv',async original=>({...await original<typeof import('../src/lib/csv/parse-csv')>(),parseCsvFile:harness.parse}));
vi.mock('../src/lib/crm/clean/export-csv',()=>({downloadCleanedCsv:harness.crmDownload}));
vi.mock('../src/lib/csv-compare/export-csv',async original=>({...await original<typeof import('../src/lib/csv-compare/export-csv')>(),downloadComparisonExport:harness.compareDownload}));
vi.mock('../src/lib/shopify/export',()=>({downloadShopifyCsv:harness.shopifyDownload}));
vi.mock('../src/app/billing/actions',()=>({checkoutAction:harness.checkout}));
vi.mock('next/navigation',()=>({usePathname:()=>'/'}));
import {parseCsvText} from '../src/lib/csv/parse-csv';
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

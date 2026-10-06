'use client';
import {useAccount} from '@/components/auth/account-provider';
import {useEffect,useRef,useState} from 'react';
import {ShieldCheck} from 'lucide-react';
import {parseCsvFile,CsvError} from '@/lib/csv/parse-csv';
import type {ParsedCsv} from '@/lib/csv/types';
import {shopifyFields,shopifyFormatUrl} from '@/lib/shopify/fields';
import {suggestMappings} from '@/lib/shopify/mapping';
import {transformSupplier} from '@/lib/shopify/transform';
import {applyOutputEdit,createWorkingOutput,resetWorkingOutput,type WorkingOutput} from '@/lib/shopify/working';
import {canExport} from '@/lib/shopify/validate';
import {downloadShopifyCsv} from '@/lib/shopify/export';
import {defaultOptions,type Mapping,type TransformOptions,type ShopifyResult} from '@/lib/shopify/types';
import {ShopifyOutputPreview} from '../shopify-output-preview';
import {FileDropzone} from '../file-dropzone';
import {SelectedFiles} from '../selected-files';
import {WorkspaceShell} from '../workspace-shell';
import {plans} from '@/config/plans';
import {rowViolation,fileSizeViolation,fileSizeLimitMessage,type UsageViolation} from '@/lib/entitlements';
import {PlanIndicator,UpgradePrompt} from '../upgrade-prompt';
const acceptedTypes=['.csv'] as const;
const number=new Intl.NumberFormat('en');
export function SupplierCSVToShopify(){
 const plan=useAccount().plan;
 const [usage,setUsage]=useState<UsageViolation|null>(null);
 const [file,setFile]=useState<File|null>(null),[csv,setCsv]=useState<ParsedCsv|null>(null),[mapping,setMapping]=useState<Mapping>({}),[options,setOptions]=useState<TransformOptions>({...defaultOptions});
 const [working,setWorking]=useState<WorkingOutput|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[resetKey,setResetKey]=useState(0);
 const result:ShopifyResult|null=working?.result??null;
 const controller=useRef<AbortController|null>(null),resultRef=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const baseline=working?.baseline;
 useEffect(()=>{if(baseline)resultRef.current?.focus({preventScroll:true});},[baseline]);
 function invalidate(){setUsage(null);setWorking(null);setError('');}
 function remove(){controller.current?.abort();setFile(null);setCsv(null);setMapping({});setOptions({...defaultOptions});setBusy(false);invalidate();setResetKey(value=>value+1);}
 async function select(selected:File){
  controller.current?.abort();const abort=new AbortController();controller.current=abort;setFile(selected);setCsv(null);setMapping({});setOptions({...defaultOptions});invalidate();setBusy(true);
  try{const parsed=await parseCsvFile(selected,abort.signal);if(abort.signal.aborted)return;setCsv(parsed);const blocked=rowViolation(plan,'supplier-csv-to-shopify',parsed.rows.length,selected.name);setUsage(blocked);if(!blocked)setMapping(suggestMappings(parsed.columns));}
  catch(caught){if(!abort.signal.aborted)setError(caught instanceof CsvError?caught.message:'This CSV could not be read.');}
  finally{if(controller.current===abort)setBusy(false);}
 }
 function changeOptions(next:Partial<TransformOptions>){setOptions(current=>({...current,...next}));invalidate();}
 return <WorkspaceShell state={busy?'processing':result?'result':error&&!csv?'error':csv?'file-selected':'idle'}
 upload={<><PlanIndicator tool="supplier-csv-to-shopify"/>{file&&<SelectedFiles files={[file]} onRemove={remove}/>}<FileDropzone key={resetKey} acceptedTypes={acceptedTypes} multiple={false} maxFileSize={plans[plan].fileSizeBytes} fileSizeError={file=>fileSizeLimitMessage(plan,file.size)} onFileSizeRejected={file=>setUsage(fileSizeViolation(plan,'supplier-csv-to-shopify',file.size,file.name))} title="Drop your supplier CSV here" fileTypeLabel="CSV" fileTypeError="This tool supports CSV files only." onFilesSelected={files=>{void select(files[0]);}} onValidationChange={message=>{if(message){controller.current?.abort();setCsv(null);setBusy(false);invalidate();setError(message);}}}/>{csv&&<><dl className="health-summary supplier-file-summary"><div className="supplier-filename"><dt>File</dt><dd title={file?.name}>{file?.name}</dd></div><div><dt>Rows</dt><dd>{number.format(csv.rows.length)}</dd></div><div><dt>Columns</dt><dd>{csv.columns.length}</dd></div><div><dt>Delimiter</dt><dd>{csv.delimiter===';'?'Semicolon':csv.delimiter==='\t'?'Tab':'Comma'}</dd></div></dl>{csv.warnings.map(warning=><p className="compare-warning" key={warning}>{warning}</p>)}</>}{usage&&<UpgradePrompt usage={usage}/>}<p className="muted">For new, simple products only: one source row becomes one product. Variants, multiple images and existing variant updates are not supported.</p></>}
 settings={csv&&!usage&&<><h2>Map product columns</h2><p className="muted">Suggestions use header names only. Review every mapping. Leave optional fields blank to omit them from the output. Title is required; an unmapped URL handle is generated from Title.</p><div className="shopify-mapping-grid">{shopifyFields.map(field=><label key={field} htmlFor={'shopify-'+field.replace(/\W/g,'-')}>{field}<select id={'shopify-'+field.replace(/\W/g,'-')} aria-label={'Map '+field} value={mapping[field]??''} onChange={event=>{setMapping(current=>({...current,[field]:event.target.value||undefined}));invalidate();}}><option value="">{field==='URL handle'?'Generate from Title':field==='Status'||field==='Published on online store'?'Use default':'No mapping / Leave blank'}</option>{csv.columns.map((column,index)=><option value={column.key} key={column.key}>{column.name}{csv.columns.filter(c=>c.name===column.name).length>1?' (column '+(index+1)+')':''}</option>)}</select></label>)}</div>
 <h3>Import defaults</h3><p className="muted">Defaults apply only when the corresponding field is unmapped.</p><div className="compare-key-grid"><label>Status default<select aria-label="Status default" value={options.status} onChange={e=>changeOptions({status:e.target.value as TransformOptions['status']})}><option value="draft">draft</option><option value="active">active</option><option value="archived">archived</option></select></label><label>Published on online store default<select aria-label="Published on online store default" value={String(options.published)} onChange={e=>changeOptions({published:e.target.value==='true'})}><option value="false">false</option><option value="true">true</option></select></label><label>Price format<select aria-label="Price format" value={options.priceFormat} onChange={e=>changeOptions({priceFormat:e.target.value as TransformOptions['priceFormat']})}><option value="auto">Auto</option><option value="comma">Decimal comma</option><option value="point">Decimal point</option></select></label></div>
 {mapping['URL handle']&&<label className="shopify-handle-option"><input type="checkbox" checked={options.uniqueMappedHandles} onChange={e=>changeOptions({uniqueMappedHandles:e.target.checked})}/>Make duplicate handles unique</label>}
 <p className="muted">Shopify&apos;s product CSV inventory quantity is intended for single-location stores. Multi-location inventory uses a separate inventory workflow.</p><p className="muted">Shopify needs publicly accessible image URLs to import product images. Toolgrain does not fetch images or check availability.</p></>}
 action={<button className="button" type="button" disabled={!csv||busy||!!usage} onClick={()=>{if(csv&&!usage){setWorking(createWorkingOutput(transformSupplier(csv,mapping,options)));setError('');}}}>Validate and preview</button>}
 error={error&&<p role="alert" className="file-error">{error}</p>}
 result={result&&<div ref={resultRef} tabIndex={-1} className="analysis-focus" aria-label="Shopify validation result"><h2>Shopify output preview</h2><dl className="health-summary">{Object.entries({Products:result.summary.products,'Mapped fields':result.summary.mappedFields,'Generated handles':result.summary.generatedHandles,Errors:result.summary.errors,Warnings:result.summary.warnings}).map(([label,count])=><div key={label}><dt>{label}</dt><dd>{number.format(count)}</dd></div>)}</dl>
 <button type="button" className="report-more" disabled={!working?.edits} onClick={()=>setWorking(current=>current?resetWorkingOutput(current):null)}>Reset changes</button><p role="status" className="muted">{working?.edits??0} committed corrections · {result.summary.errors} errors · {result.summary.warnings} warnings</p><ShopifyOutputPreview key={working?.resetEpoch} result={result} onEdit={(row,field,value)=>{if(!working)return [];const next=applyOutputEdit(working,row,field,value,options);setWorking(next);return next.result.issues.filter(issue=>issue.severity==='error'&&issue.field===field&&issue.rows.includes(row)).map(issue=>issue.message);}}/>
 <p>Toolgrain prepares the file for Shopify&apos;s product CSV format. Always review Shopify&apos;s import preview before completing an import.</p><p className="muted">This file is for new simple products. Do not use it to overwrite existing products with variants. <a className="text-link" href={shopifyFormatUrl} target="_blank" rel="noreferrer">Shopify product CSV documentation</a></p>
 <button className="button" type="button" disabled={!canExport(result)} onClick={()=>{try{downloadShopifyCsv(result,file?.name??'supplier-products.csv');setError('');}catch{setError('This Shopify CSV could not be prepared. Review errors and try again.');}}}>Download Shopify CSV</button>{error&&<p role="alert" className="file-error">{error}</p>}{!canExport(result)&&<p role="status">Resolve blocking errors before downloading.</p>}</div>}
 note={<p><ShieldCheck size={15} aria-hidden="true"/>Your file stays on your device. Parsing, mapping, validation and export run locally in your browser. No CSV contents are uploaded.</p>}/>
}

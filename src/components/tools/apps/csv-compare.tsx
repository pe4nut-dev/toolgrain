'use client';
import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { parseCsvFile, CsvError } from '@/lib/csv/parse-csv';
import type { ParsedCsv } from '@/lib/csv/types';
import { compareCsv } from '@/lib/csv-compare/compare-csv';
import { analyzeSchema } from '@/lib/csv-compare/schema-analysis';
import type { ComparisonResult } from '@/lib/csv-compare/types';
import { FileDropzone } from '../file-dropzone';
import { SelectedFiles } from '../selected-files';
import { WorkspaceShell } from '../workspace-shell';
import { CsvCompareResult } from '../csv-compare-result';
type Side = 'old' | 'new';
type Slot = { file: File | null; csv: ParsedCsv | null; key: string; error: string | null; parsing: boolean; version: number };
const emptySlot = (): Slot => ({ file: null, csv: null, key: '', error: null, parsing: false, version: 0 });
const acceptedTypes = ['.csv'] as const;
const number = new Intl.NumberFormat('en');
export function CSVCompare() {
 const [slots,setSlots] = useState<Record<Side,Slot>>({old:emptySlot(),new:emptySlot()});
 const [result,setResult] = useState<ComparisonResult | null>(null);
 const controllers = useRef<Partial<Record<Side,AbortController>>>({});
 const resultRef = useRef<HTMLDivElement>(null);
 useEffect(()=>{const active=controllers.current;return ()=>{active.old?.abort();active.new?.abort();};},[]);
 useEffect(()=>{if(result)resultRef.current?.focus({preventScroll:true});},[result]);
 function clear(side:Side) {
  controllers.current[side]?.abort();setResult(null);
  setSlots(current=>({...current,[side]:{...emptySlot(),version:current[side].version+1}}));
 }
 async function select(side:Side,file:File) {
  controllers.current[side]?.abort(); const controller = new AbortController();controllers.current[side]=controller;
  const previousName=slots[side].csv?.columns.find(c=>c.key===slots[side].key)?.name;
  setResult(null);setSlots(current=>({...current,[side]:{...emptySlot(),file,parsing:true,version:current[side].version+1}}));
  try {
   const csv=await parseCsvFile(file,controller.signal);if(controller.signal.aborted)return;
   setSlots(current=>{
    const other:Side=side==='old'?'new':'old';const candidates=csv.columns.filter(c=>c.name===previousName);
    let key=candidates.length===1?candidates[0].key:'';
    if(!key){const otherName=current[other].csv?.columns.find(c=>c.key===current[other].key)?.name;const same=csv.columns.filter(c=>c.name===otherName);if(same.length===1)key=same[0].key;}
    return {...current,[side]:{...current[side],csv,key,parsing:false,error:null}};
   });
  } catch(error) {if(controller.signal.aborted)return;setSlots(current=>({...current,[side]:{...current[side],parsing:false,error:error instanceof CsvError?error.message:'Something went wrong while reading this CSV.'}}));}
 }
 function chooseKey(side:Side,key:string) {
  setResult(null);setSlots(current=>{
   const other:Side=side==='old'?'new':'old';const name=current[side].csv?.columns.find(c=>c.key===key)?.name;
   const matches=current[other].csv?.columns.filter(c=>c.name===name) ?? [];
   return {...current,[side]:{...current[side],key},[other]:{...current[other],key:!current[other].key&&matches.length===1?matches[0].key:current[other].key}};
  });
 }
 const a=slots.old,b=slots.new,ready=!!(a.csv&&b.csv),parsing=a.parsing||b.parsing;
 const schema=a.csv&&b.csv?analyzeSchema(a.csv.columns,b.csv.columns):null;
 return <WorkspaceShell state={parsing?'processing':result?'result':'idle'}
 upload={<div className="compare-upload-grid">{(['old','new'] as const).map(side=>{const slot=slots[side];return <section key={side} aria-labelledby={'compare-'+side+'-title'}><h2 id={'compare-'+side+'-title'}>{side==='old'?'Old':'New'} CSV</h2>{slot.file && <SelectedFiles files={[slot.file]} onRemove={()=>clear(side)} />}
 <FileDropzone key={slot.version} acceptedTypes={acceptedTypes} multiple={false} maxFileSize={10*1024*1024} fileTypeLabel="CSV" title={slot.file?'Drop a CSV to replace this file':'Drop your '+side+' CSV here'} fileTypeError="This tool supports CSV files only." onFilesSelected={files=>{void select(side,files[0]);}} onValidationChange={error=>{if(error){controllers.current[side]?.abort();setResult(null);setSlots(current=>({...current,[side]:{...current[side],csv:null,key:'',error:null,parsing:false}}));}}} />
 <p role="status">{slot.parsing?'Parsing locally…':slot.csv?'Ready: '+number.format(slot.csv.rows.length)+' rows · '+slot.csv.columns.length+' columns':!slot.file?'Select a CSV with a header row.':''}</p>{slot.error && <p className="file-error" role="alert">{slot.error}</p>}{slot.csv?.warnings.map(w=><p key={w} className="compare-warning">{w}</p>)}</section>;})}</div>}
 settings={ready&&schema&&<>
 <div className="compare-schema"><h3>Column structure</h3><p>Shared columns: {schema.shared.length} · Only in old: {schema.onlyOld.length} · Only in new: {schema.onlyNew.length}</p><p>Only in old: {schema.onlyOld.join(', ')||'None'}</p><p>Only in new: {schema.onlyNew.join(', ')||'None'}</p>{schema.ambiguous.length>0 && <p className="compare-warning">Repeated headers cannot be paired reliably and are excluded from field comparison: {schema.ambiguous.join(', ')}. Key dropdowns identify repeated columns by position.</p>}<p className="muted">Column order does not matter. Only shared non-key columns are compared; schema-only changes do not mark rows changed.</p></div>
 <div className="compare-key-grid">{(['old','new'] as const).map(side=><label key={side} htmlFor={'compare-'+side+'-key'}>{side==='old'?'Old':'New'} file key<select aria-label={side==='old'?'Old file key':'New file key'} id={'compare-'+side+'-key'} value={slots[side].key} onChange={e=>chooseKey(side,e.target.value)}><option value="">Choose a key column</option>{slots[side].csv!.columns.map((column,index)=><option key={column.key} value={column.key}>{column.name}{slots[side].csv!.columns.filter(c=>c.name===column.name).length>1?' (column '+(index+1)+')':''}</option>)}</select></label>)}</div>
 <p className="muted">Choose the column that identifies a record, such as id, email or sku. Confirm both keys before comparing. Matching trims key whitespace and keeps case significant.</p>
 </>}
 action={<button type="button" className="button" disabled={!ready||parsing||!a.key||!b.key} onClick={()=>{if(a.csv&&b.csv)setResult(compareCsv(a.csv,b.csv,a.key,b.key));}}>Compare CSVs</button>}
 result={result&&a.csv&&b.csv&&<div ref={resultRef} tabIndex={-1} className="analysis-focus" aria-label="Comparison complete"><CsvCompareResult result={result} oldCsv={a.csv} newCsv={b.csv} oldFilename={a.file!.name} newFilename={b.file!.name} /></div>}
 note={<p><ShieldCheck size={15} aria-hidden="true" />Your files stay on your device. Parsing, comparison and export run locally in your browser. No CSV contents are uploaded.</p>}
 />;
}

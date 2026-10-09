'use client';
import React,{useMemo,useRef,useState} from 'react';
import type {ShopifyResult} from '../../lib/shopify/types';
import {cellIssues,indexOutputIssues,issueSeverity} from '../../lib/shopify/issue-index';
import {ShopifyIssueValue} from './shopify-issue-value';
import {ShopifyEditCell} from './shopify-edit-cell';
import {editableFields} from '../../lib/shopify/working';
import type {ShopifyField} from '../../lib/shopify/fields';
const number=new Intl.NumberFormat('en');
export type ShopifyRowFilter='all'|'error'|'warning';
export function ShopifyOutputPreview({result,onEdit,filter:controlledFilter,onFilterChange}:{result:ShopifyResult;onEdit?:(row:number,field:ShopifyField,value:string)=>string[];filter?:ShopifyRowFilter;onFilterChange?:(filter:ShopifyRowFilter)=>void}){
 const index=useMemo(()=>indexOutputIssues(result),[result]);
 const [localFilter,setLocalFilter]=useState<ShopifyRowFilter>('all'),[limit,setLimit]=useState(20);
 const filter=controlledFilter??localFilter,scroll=useRef<HTMLDivElement>(null),lastIssue=useRef<string|null>(null);
 const [activeCell,setActiveCell]=useState<string|null>(null);
 const allRows=useMemo(()=>result.rows.map((_,i)=>i+1),[result]);
 const severityRows=useMemo(()=>{
  const error=new Set<number>(),warning=new Set<number>();
  for(const issue of result.issues){if(issue.severity==='suggestion')continue;const target=issue.severity==='error'?error:warning;for(const row of issue.rows.length?issue.rows:allRows)target.add(row);}
  return {error:[...error].sort((a,b)=>a-b),warning:[...warning].sort((a,b)=>a-b)};
 },[result,allRows]);
 const rows=filter==='all'?allRows:severityRows[filter];
 const relevant=filter==='all'?[...new Set([...severityRows.error,...severityRows.warning])].sort((a,b)=>a-b):rows;
 function changeFilter(next:ShopifyRowFilter){setActiveCell(null);setLocalFilter(next);onFilterChange?.(next);setLimit(20);lastIssue.current=null;}
 function nextIssue(){
  const targets=relevant.flatMap<{row:number;field?:ShopifyField}>(row=>{
   const fields=result.fields.filter(field=>cellIssues(index,row,field).some(issue=>filter==='all'?issue.severity==='error'||issue.severity==='warning':issue.severity===filter));
   return fields.length?fields.map(field=>({row,field})): [{row,field:undefined}];
  });
  if(!targets.length)return;
  const previous=targets.findIndex(target=>target.row+':'+(target.field??'row')===lastIssue.current);
  const target=targets[(previous+1)%targets.length],key=target.row+':'+(target.field??'row');
  lastIssue.current=key;
  setActiveCell(onEdit&&target.field&&editableFields.includes(target.field)?key:null);
  setLimit(Math.max(limit,rows.indexOf(target.row)+1));
  requestAnimationFrame(()=>{
   const row=scroll.current?.querySelector<HTMLElement>('[data-row="'+target.row+'"]');
   const cell=(target.field?row?.querySelector<HTMLElement>('[data-field="'+target.field+'"]'):null)??row;
   const control=cell?.querySelector<HTMLElement>('input,button,summary')??cell;
   cell?.scrollIntoView({block:'nearest',inline:'nearest'});
   control?.focus({preventScroll:true});
  });
 }
 return <><section aria-label="Validation issues" className="shopify-issue-summary"><h3>Review issues</h3><p>{number.format(result.summary.errors)} errors · {number.format(result.summary.warnings)} warnings</p><p className="muted">Errors and warnings are highlighted in the table below. Hover, focus or tap an affected value to read its explanation. Click an editable value to correct it. Data rows start at 1 after the header.</p>{index.globalNotes.length>0&&<details><summary>Mapping notes ({index.globalNotes.length})</summary>{index.globalNotes.map((issue,i)=><p key={i}><strong>{issue.severity}:</strong> {issue.message}</p>)}</details>}</section>
 <div className="shopify-filter-bar" role="group" aria-label="Filter Shopify output rows">{(['all','error','warning'] as const).map(mode=><button type="button" className="button secondary" key={mode} aria-pressed={filter===mode} onClick={()=>changeFilter(mode)}>{mode==='all'?'All rows':mode==='error'?'Rows with errors':'Rows with warnings'} <span>{number.format(mode==='all'?allRows.length:severityRows[mode].length)}</span></button>)}<button type="button" className="button ghost" disabled={!relevant.length} onClick={nextIssue}>Next issue</button></div>
 <div ref={scroll} className="compare-table-scroll shopify-table-scroll" role="region" tabIndex={0} aria-label="Shopify output table"><table className="compare-table shopify-output-table"><caption className="sr-only">Generated Shopify output values. Affected cells have severity indicators and focusable explanations.</caption><thead><tr><th scope="col">Data row</th>{result.fields.map(field=><th scope="col" data-field={field} key={field}>{field}</th>)}</tr></thead><tbody>{rows.slice(0,limit).map(rowNumber=>{const row=result.rows[rowNumber-1],notes=index.rowNotes.get(rowNumber)??[];return <tr key={rowNumber} data-row={rowNumber} tabIndex={-1} aria-label={'Product row '+rowNumber}><th scope="row">{notes.length?<ShopifyIssueValue value={String(rowNumber)} issues={notes} row={rowNumber} field="Row review"/>:rowNumber}</th>{result.fields.map(field=>{const issues=cellIssues(index,rowNumber,field),severity=issueSeverity(issues);return <td key={field} data-field={field} className={severity?'shopify-output-issue '+severity:undefined}>{onEdit&&editableFields.includes(field)?<ShopifyEditCell value={row[field]??''} issues={issues} row={rowNumber} field={field} editing={activeCell===rowNumber+":"+field} onOpen={()=>setActiveCell(rowNumber+":"+field)} onClose={()=>setActiveCell(null)} onApply={value=>onEdit(rowNumber,field,value)}/>:<ShopifyIssueValue value={row[field]??''} issues={issues} row={rowNumber} field={field}/>}</td>;})}</tr>;})}</tbody></table></div><p className="preview-count" role="status">Showing {Math.min(limit,rows.length)} of {number.format(rows.length)} {filter==='all'?'products':'products with '+(filter==='error'?'errors':'warnings')}</p>{!rows.length&&<p>No rows match this filter. Choose All rows to see every product.</p>}{rows.length>limit&&<button type="button" className="button ghost" onClick={()=>setLimit(n=>n+20)}>Show 20 more products</button>}</>;
}

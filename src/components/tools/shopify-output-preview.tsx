'use client';
import React,{useMemo,useState} from 'react';
import type {ShopifyResult} from '../../lib/shopify/types';
import {cellIssues,indexOutputIssues,issueSeverity} from '../../lib/shopify/issue-index';
import {ShopifyIssueValue} from './shopify-issue-value';
import {ShopifyEditCell} from './shopify-edit-cell';
import {editableFields} from '../../lib/shopify/working';
import type {ShopifyField} from '../../lib/shopify/fields';
const number=new Intl.NumberFormat('en');
export function ShopifyOutputPreview({result,onEdit}:{result:ShopifyResult;onEdit?:(row:number,field:ShopifyField,value:string)=>string[]}){
 const index=useMemo(()=>indexOutputIssues(result),[result]);
 const [issuesOnly,setIssuesOnly]=useState(false),[limit,setLimit]=useState(20);
 const [activeCell,setActiveCell]=useState<string|null>(null);
 const allRows=useMemo(()=>result.rows.map((_,i)=>i+1),[result]);
 const rows=issuesOnly?index.affectedRows:allRows;
 return <><section aria-label="Validation issues" className="shopify-issue-summary"><h3>Review issues</h3><p>{number.format(result.summary.errors)} errors · {number.format(result.summary.warnings)} warnings</p><p className="muted">Errors and warnings are highlighted in the table below. Hover, focus or tap an affected value to read its explanation. Click an editable value to correct it. Data rows start at 1 after the header.</p>{index.globalNotes.length>0&&<details><summary>Mapping notes ({index.globalNotes.length})</summary>{index.globalNotes.map((issue,i)=><p key={i}><strong>{issue.severity}:</strong> {issue.message}</p>)}</details>}</section>
 <div className="preview-switch" role="group" aria-label="Filter Shopify output rows"><button type="button" aria-pressed={!issuesOnly} onClick={()=>{setActiveCell(null);setIssuesOnly(false);setLimit(20);}}>All rows</button><button type="button" aria-pressed={issuesOnly} onClick={()=>{setActiveCell(null);setIssuesOnly(true);setLimit(20);}}>Rows with issues</button></div>
 <div className="compare-table-scroll" role="region" tabIndex={0} aria-label="Shopify output table"><table className="compare-table shopify-output-table"><caption className="sr-only">Generated Shopify output values. Affected cells have severity indicators and focusable explanations.</caption><thead><tr><th scope="col">Data row</th>{result.fields.map(field=><th scope="col" key={field}>{field}</th>)}</tr></thead><tbody>{rows.slice(0,limit).map(rowNumber=>{const row=result.rows[rowNumber-1],notes=index.rowNotes.get(rowNumber)??[];return <tr key={rowNumber}><th scope="row">{notes.length?<ShopifyIssueValue value={String(rowNumber)} issues={notes} row={rowNumber} field="Row review"/>:rowNumber}</th>{result.fields.map(field=>{const issues=cellIssues(index,rowNumber,field),severity=issueSeverity(issues);return <td key={field} className={severity?'shopify-output-issue '+severity:undefined}>{onEdit&&editableFields.includes(field)?<ShopifyEditCell value={row[field]??''} issues={issues} row={rowNumber} field={field} editing={activeCell===rowNumber+":"+field} onOpen={()=>setActiveCell(rowNumber+":"+field)} onClose={()=>setActiveCell(null)} onApply={value=>onEdit(rowNumber,field,value)}/>:<ShopifyIssueValue value={row[field]??''} issues={issues} row={rowNumber} field={field}/>}</td>;})}</tr>;})}</tbody></table></div><p className="preview-count" role="status">Showing {Math.min(limit,rows.length)} of {number.format(rows.length)} {issuesOnly?'products with issues':'products'}</p>{!rows.length&&<p>No rows with issues.</p>}{rows.length>limit&&<button type="button" className="report-more" onClick={()=>setLimit(n=>n+20)}>Show 20 more products</button>}</>;
}

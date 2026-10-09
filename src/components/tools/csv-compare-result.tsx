'use client';
import {trackToolgrainEvent} from '@/lib/analytics-events';
import {useAccount} from '@/components/auth/account-provider';
import { Download } from 'lucide-react';
import { createComparisonExport, downloadComparisonExport, type ExportCategory } from '@/lib/csv-compare/export-csv';
import { useState } from 'react';
import type { ParsedCsv } from '@/lib/csv/types';
import type { ComparisonResult, ChangedRecord, RowRef } from '@/lib/csv-compare/types';
const labels = { changed: 'Changed', added: 'Added', removed: 'Removed', unchanged: 'Unchanged', issues: 'Key issues' };
type Category = keyof typeof labels;
type Filter = Category | 'all';
const number = new Intl.NumberFormat('en');
function value(text: string) { return text === '' ? <span className="muted">(empty)</span> : text.length > 120 ? <details className="compare-long-value"><summary title={text}>{text}</summary><p>{text}</p></details> : text; }
function RowTable({ csv, rows }: { csv: ParsedCsv; rows: RowRef[] }) {
 return <div className="compare-table-scroll" role="region" aria-label="CSV row preview" tabIndex={0}><table className="compare-table"><caption className="sr-only">Original values from the selected CSV</caption><thead><tr><th scope="col">Record</th>{csv.columns.map(c=><th scope="col" key={c.key}>{c.name}</th>)}</tr></thead><tbody>{rows.map(ref=><tr key={ref.rowNumber}><th scope="row">{ref.rowNumber}</th>{csv.columns.map(c=><td key={c.key}>{value(ref.row[c.key] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
function ChangedRecordComparison({record,result}:{record:ChangedRecord;result:ComparisonResult}) {
 const [open,setOpen]=useState(false);
 const changedColumns=new Set(record.changes.map(change=>change.column));
 return <details className="compare-diff" onToggle={event=>setOpen(event.currentTarget.open)}><summary><strong>Record key: {record.key}</strong><span>Old row {record.oldRow.rowNumber} · New row {record.newRow.rowNumber} · {record.changes.length} changed {record.changes.length===1?'field':'fields'}</span></summary>
 {open&&<div className="compare-table-scroll" role="region" tabIndex={0} aria-label={'Full row comparison for key '+record.key}><table className="compare-table changed-record-table"><caption className="sr-only">Original old and new values for record key {record.key}. Changed fields are labeled Changed.</caption><thead><tr><th scope="col">Column</th><th scope="col">Old</th><th scope="col">New</th></tr></thead><tbody>{result.schema.shared.map(column=>{const changed=changedColumns.has(column.name);return <tr key={column.name}><th scope="row">{column.name}{changed&&<span className="changed-field-label">Changed</span>}</th><td className={changed?'changed-value':undefined}>{value(record.oldRow.row[column.oldColumn.key]??'')}</td><td className={changed?'changed-value':undefined}>{value(record.newRow.row[column.newColumn.key]??'')}</td></tr>;})}</tbody></table></div>}
 </details>;
}
export function CsvCompareResult({ result, oldCsv, newCsv, oldFilename, newFilename }: { result: ComparisonResult; oldCsv: ParsedCsv; newCsv: ParsedCsv; oldFilename: string; newFilename: string }) {
 const [category, setCategory] = useState<Filter>(result.changed.length ? 'changed' : (['added','removed','unchanged','issues'] as const).find(key=>result[key].length) ?? 'changed');
 const plan=useAccount().plan;
 const [exportError,setExportError]=useState('');
 const [limit, setLimit] = useState(50);
 const visibleCount=category==='all'?(Object.keys(labels) as Category[]).reduce((sum,key)=>sum+result[key].length,0):result[category].length;
 const affectedRows = result.issues.reduce((total, issue)=>total+issue.oldRows.length+issue.newRows.length,0);
 return <section className="compare-results" aria-label="Comparison results">
 <h2 tabIndex={-1}>Comparison complete</h2>
 <p>Compared using: <strong>{result.oldKey.name}</strong> (old) → <strong>{result.newKey.name}</strong> (new). Keys are trimmed and otherwise matched exactly.</p>
 {!result.schema.shared.some(c=>c.oldColumn.key!==result.oldKey.key&&c.newColumn.key!==result.newKey.key) && <p className="compare-warning">No shared non-key columns are available. Unchanged means the keys match; no data fields could be compared.</p>}
 <dl className="compare-counts">{(Object.keys(labels) as Category[]).map(key=><div key={key}><dt>{labels[key]}</dt><dd>{number.format(result[key].length)}</dd></div>)}</dl>
 {affectedRows > 0 && <p className="compare-warning">Rows with missing or duplicate key values cannot be compared reliably. {number.format(affectedRows)} rows across both files are excluded, including any counterpart of a duplicate key. The Key issues count shows issue groups.</p>}
 <div className="filters compare-filters" role="group" aria-label="Inspect comparison category"><button type="button" aria-pressed={category==='all'} onClick={()=>{setCategory('all');setLimit(50);}}>All</button>{(Object.keys(labels) as Category[]).map(key=><button key={key} type="button" aria-pressed={category===key} onClick={()=>{setCategory(key);setLimit(50);}}>{labels[key]} <span>{number.format(result[key].length)}</span></button>)}</div>
 <p role="status" aria-live="polite">Showing {category==='all'?(Object.keys(labels) as Category[]).reduce((sum,key)=>sum+Math.min(limit,result[key].length),0):Math.min(limit,visibleCount)} of {number.format(visibleCount)} {(category==='all'?'results':labels[category].toLowerCase())}{category==='all'?'':category==='issues'?' groups':' records'}.</p>
 <p className="muted">Record numbers count the header as record 1; quoted multiline cells may span several physical lines.</p>
 {!visibleCount && <p className="empty-state">No {(category==='all'?'results':labels[category].toLowerCase())} to show.</p>}
 {(category==='changed'||category==='all') && result.changed.slice(0,limit).map(record=><ChangedRecordComparison key={record.key} record={record} result={result}/>)}
 {(category==='added'||category==='all') && result.added.length>0 && <section aria-label="Added rows"><h3>Added rows</h3><RowTable csv={newCsv} rows={result.added.slice(0,limit)} /></section>}
 {(category==='removed'||category==='all') && result.removed.length>0 && <section aria-label="Removed rows"><h3>Removed rows</h3><RowTable csv={oldCsv} rows={result.removed.slice(0,limit)} /></section>}
 {(category==='unchanged'||category==='all') && result.unchanged.length>0 && <><h3>Unchanged rows</h3><p className="muted">Preview shows the new file’s original values.</p><RowTable csv={newCsv} rows={result.unchanged.slice(0,limit).map(record=>record.newRow)} /></>}
 {(category==='issues'||category==='all') && result.issues.slice(0,limit).map((issue,index)=><details className="compare-diff" key={index}><summary><strong>{issue.reason==='missing' ? 'Missing key in '+(issue.oldRows.length?'old':'new')+' CSV' : 'Duplicate key in '+(issue.duplicateIn==='both'?'old and new':issue.duplicateIn)+' CSV'}</strong>{issue.key && <span> · Key: {issue.key}</span>}</summary>{issue.oldRows.length>0 && <p>Old CSV records: {issue.oldRows.slice(0,50).map(r=>r.rowNumber).join(', ')}{issue.oldRows.length>50?' … ('+issue.oldRows.length+' total)':''}</p>}{issue.newRows.length>0 && <p>New CSV records: {issue.newRows.slice(0,50).map(r=>r.rowNumber).join(', ')}{issue.newRows.length>50?' … ('+issue.newRows.length+' total)':''}</p>}<p className="muted">These records are excluded. No record is chosen automatically.</p></details>)}
 {(category==='all'?(Object.keys(labels) as Category[]).some(key=>result[key].length>limit):visibleCount>limit) && <button className="button secondary" type="button" onClick={()=>setLimit(n=>n+50)}>Show 50 more</button>}
 <section className="compare-exports" aria-label="Export results"><h2>Export results</h2><p className="muted">Download the full results, including records beyond the preview. Exports are generated locally as UTF-8 CSV files.</p><div className="compare-export-grid">{(['added','removed','changed','issues'] as ExportCategory[]).map(kind=>{
 const count=kind==='changed'?result.changed.reduce((sum,record)=>sum+record.changes.length,0):result[kind].length;
 const label=kind==='added'?'Added rows':kind==='removed'?'Removed rows':kind==='changed'?'Changed fields':'Key issues';
 return <div key={kind}><h3>{label}</h3><p>{number.format(count)} {kind==='changed'?(count===1?'changed field':'changed fields'):kind==='issues'?(count===1?'issue group':'issue groups'):(count===1?'row':'rows')}</p><button type="button" className="button" disabled={!count} onClick={()=>{try{const report=createComparisonExport(kind,result,oldCsv,newCsv,oldFilename,newFilename);if(report){downloadComparisonExport(report);trackToolgrainEvent('export_clicked',{tool:'csv-compare',plan});}setExportError('');}catch{setExportError('This CSV could not be prepared for download. Try again.');}}}><Download size={16} aria-hidden="true" />Download {kind==='issues'?'key issues':kind} CSV</button></div>;
 })}</div>{exportError&&<p className="file-error" role="alert">{exportError}</p>}</section>
 </section>;
}

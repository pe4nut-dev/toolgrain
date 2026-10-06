'use client';
import { Download } from 'lucide-react';
import { createComparisonExport, downloadComparisonExport, type ExportCategory } from '@/lib/csv-compare/export-csv';
import { useState } from 'react';
import type { ParsedCsv } from '@/lib/csv/types';
import type { ComparisonResult, RowRef } from '@/lib/csv-compare/types';
const labels = { changed: 'Changed', added: 'Added', removed: 'Removed', unchanged: 'Unchanged', issues: 'Key issues' };
type Category = keyof typeof labels;
const number = new Intl.NumberFormat('en');
function value(text: string) { return text === '' ? <span className="muted">(empty)</span> : text; }
function RowTable({ csv, rows }: { csv: ParsedCsv; rows: RowRef[] }) {
 return <div className="compare-table-scroll" role="region" aria-label="CSV row preview" tabIndex={0}><table className="compare-table"><caption className="sr-only">Original values from the selected CSV</caption><thead><tr><th scope="col">Record</th>{csv.columns.map(c=><th scope="col" key={c.key}>{c.name}</th>)}</tr></thead><tbody>{rows.map(ref=><tr key={ref.rowNumber}><th scope="row">{ref.rowNumber}</th>{csv.columns.map(c=><td key={c.key}>{value(ref.row[c.key] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
export function CsvCompareResult({ result, oldCsv, newCsv, oldFilename, newFilename }: { result: ComparisonResult; oldCsv: ParsedCsv; newCsv: ParsedCsv; oldFilename: string; newFilename: string }) {
 const [category, setCategory] = useState<Category>(result.changed.length ? 'changed' : (['added','removed','unchanged','issues'] as const).find(key=>result[key].length) ?? 'changed');
 const [limit, setLimit] = useState(50);
 const affectedRows = result.issues.reduce((total, issue)=>total+issue.oldRows.length+issue.newRows.length,0);
 return <section className="compare-results" aria-label="Comparison results">
 <h2 tabIndex={-1}>Comparison complete</h2>
 <p>Compared using: <strong>{result.oldKey.name}</strong> (old) → <strong>{result.newKey.name}</strong> (new). Keys are trimmed and otherwise matched exactly.</p>
 {!result.schema.shared.some(c=>c.oldColumn.key!==result.oldKey.key&&c.newColumn.key!==result.newKey.key) && <p className="compare-warning">No shared non-key columns are available. Unchanged means the keys match; no data fields could be compared.</p>}
 <dl className="compare-counts">{(Object.keys(labels) as Category[]).map(key=><div key={key}><dt>{labels[key]}</dt><dd>{number.format(result[key].length)}</dd></div>)}</dl>
 {affectedRows > 0 && <p className="compare-warning">Rows with missing or duplicate key values cannot be compared reliably. {number.format(affectedRows)} rows across both files are excluded, including any counterpart of a duplicate key. The Key issues count shows issue groups.</p>}
 <div className="filters compare-filters" role="group" aria-label="Inspect comparison category">{(Object.keys(labels) as Category[]).map(key=><button key={key} type="button" aria-pressed={category===key} onClick={()=>{setCategory(key);setLimit(50);}}>{labels[key]} <span>{number.format(result[key].length)}</span></button>)}</div>
 <p role="status" aria-live="polite">Showing {Math.min(limit,result[category].length)} of {number.format(result[category].length)} {labels[category].toLowerCase()}{category==='issues'?' groups':' records'}.</p>
 <p className="muted">Record numbers count the header as record 1; quoted multiline cells may span several physical lines.</p>
 {!result[category].length && <p className="empty-state">No {labels[category].toLowerCase()} to show.</p>}
 {category==='changed' && result.changed.slice(0,limit).map(record=><details className="compare-diff" key={record.key}><summary><strong>Key: {record.key}</strong><span> · {record.changes.length} changed {record.changes.length===1?'field':'fields'}</span></summary><p className="muted">Old record {record.oldRow.rowNumber} · New record {record.newRow.rowNumber}</p>{record.changes.map(change=><div className="compare-field" key={change.column}><h3>{change.column}</h3><dl><div><dt>Old</dt><dd>{value(change.oldValue)}</dd></div><div><dt>New</dt><dd>{value(change.newValue)}</dd></div></dl></div>)}</details>)}
 {category==='added' && result.added.length>0 && <RowTable csv={newCsv} rows={result.added.slice(0,limit)} />}
 {category==='removed' && result.removed.length>0 && <RowTable csv={oldCsv} rows={result.removed.slice(0,limit)} />}
 {category==='unchanged' && result.unchanged.length>0 && <><p className="muted">Preview shows the new file’s original values.</p><RowTable csv={newCsv} rows={result.unchanged.slice(0,limit).map(record=>record.newRow)} /></>}
 {category==='issues' && result.issues.slice(0,limit).map((issue,index)=><details className="compare-diff" key={index}><summary><strong>{issue.reason==='missing' ? 'Missing key in '+(issue.oldRows.length?'old':'new')+' CSV' : 'Duplicate key in '+(issue.duplicateIn==='both'?'old and new':issue.duplicateIn)+' CSV'}</strong>{issue.key && <span> · Key: {issue.key}</span>}</summary>{issue.oldRows.length>0 && <p>Old CSV records: {issue.oldRows.slice(0,50).map(r=>r.rowNumber).join(', ')}{issue.oldRows.length>50?' … ('+issue.oldRows.length+' total)':''}</p>}{issue.newRows.length>0 && <p>New CSV records: {issue.newRows.slice(0,50).map(r=>r.rowNumber).join(', ')}{issue.newRows.length>50?' … ('+issue.newRows.length+' total)':''}</p>}<p className="muted">These records are excluded. No record is chosen automatically.</p></details>)}
 {result[category].length>limit && <button className="button secondary" type="button" onClick={()=>setLimit(n=>n+50)}>Show 50 more</button>}
 <section className="compare-exports" aria-label="Export results"><h2>Export results</h2><p className="muted">Download the full results, including records beyond the preview. Exports are generated locally as UTF-8 CSV files.</p><div className="compare-export-grid">{(['added','removed','changed','issues'] as ExportCategory[]).map(kind=>{
 const count=kind==='changed'?result.changed.reduce((sum,record)=>sum+record.changes.length,0):result[kind].length;
 const label=kind==='added'?'Added rows':kind==='removed'?'Removed rows':kind==='changed'?'Changed fields':'Key issues';
 return <div key={kind}><h3>{label}</h3><p>{number.format(count)} {kind==='changed'?(count===1?'changed field':'changed fields'):kind==='issues'?(count===1?'issue group':'issue groups'):(count===1?'row':'rows')}</p><button type="button" className="button secondary" disabled={!count} onClick={()=>{const report=createComparisonExport(kind,result,oldCsv,newCsv,oldFilename,newFilename);if(report)downloadComparisonExport(report);}}><Download size={16} aria-hidden="true" />Download {kind==='issues'?'key issues':kind} CSV</button></div>;
 })}</div></section>
 </section>;
}

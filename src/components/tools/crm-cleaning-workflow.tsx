'use client';
import { useMemo, useState } from 'react';
import type { CsvRow } from '@/lib/csv/types';
import type { CleaningSession } from '@/lib/crm/clean/types';
import { applySafeFixes, undoSafeFixes, resetChanges } from '@/lib/crm/clean/apply-fixes';
import { decideDuplicate, unreviewDuplicate } from '@/lib/crm/clean/duplicate-decisions';
import { downloadCleanedCsv } from '@/lib/crm/clean/export-csv';
import { duplicateReasons, issueDefinitions, type DuplicateGroup } from '@/lib/crm/types';
const number=new Intl.NumberFormat('en');
type Props={session:CleaningSession;onChange:(session:CleaningSession)=>void;fileName:string};
function ReviewGroup({group,session,onChange,values}:{group:DuplicateGroup;session:CleaningSession;onChange:Props['onChange'];values:ReadonlyMap<number,CsvRow>}){
 const [open,setOpen]=useState(false),[limit,setLimit]=useState(20);
 const decision=session.duplicateDecisions[group.id];
 const status=!decision?'Unreviewed':decision.kind==='keep_all'?'Keep all':'Keep row '+decision.row;
 const reasons=[...new Set(group.matches.flatMap(match=>match.reasons))];
 return <details className="duplicate-detail cleaning-group" onToggle={event=>setOpen(event.currentTarget.open)}>
 <summary><span>{group.kind==='exact'?'Exact':'Likely'} duplicate · Rows {group.rows.slice(0,5).join(', ')}{group.rows.length>5?' + '+(group.rows.length-5)+' more':''}</span><span className="review-status">{status}</span></summary>
 {open&&<div className="duplicate-body">
  <p>{reasons.map(reason=>duplicateReasons[reason]).join(' ')}</p>
  {group.kind==='likely'&&<p className="muted">These records are connected by matching pairs. Compare the records before choosing one to keep.</p>}
  {group.kind==='exact'&&<p className="muted">These rows appear to be identical. Suggested: keep the first row. All are kept until you choose.</p>}
  <div className="cleaning-actions"><button className="button secondary" type="button" onClick={()=>onChange(decideDuplicate(session,group.id,{kind:'keep_all'}))}>{group.rows.length===2?'Keep both':'Keep all'}</button>{decision&&<button className="report-more" type="button" onClick={()=>onChange(unreviewDuplicate(session,group.id))}>Mark unreviewed</button>}</div>
  <div className="review-records">{group.rows.slice(0,limit).map(row=>{const record=values.get(row)??session.originalCsv.rows[row-1];return <article className="review-record" key={row}><h5>Row {row}{decision?.kind==='keep_row'?(decision.row===row?' · Kept':' · Excluded from export'):''}</h5><dl>{session.originalCsv.columns.map(column=><div key={column.key}><dt>{column.name}</dt><dd>{record[column.key]||'Empty'}</dd></div>)}</dl><button type="button" className="button secondary" aria-label={'Keep row '+row} onClick={()=>onChange(decideDuplicate(session,group.id,{kind:'keep_row',row}))}>Keep this row</button></article>})}</div>
  {group.rows.length>limit&&<button className="report-more" type="button" onClick={()=>setLimit(value=>value+20)}>Show 20 more records</button>}
 </div>}
 </details>;
}
export function CrmCleaningWorkflow({session,onChange,fileName}:Props){
 const [review,setReview]=useState(false),[groupLimit,setGroupLimit]=useState(20),[fixLimit,setFixLimit]=useState(20),[preview,setPreview]=useState<'original'|'cleaned'>('cleaned');
 const [downloadError,setDownloadError]=useState('');
 const reviewed=Object.keys(session.duplicateDecisions).length,groups=session.analysis.duplicateGroups;
 const values=useMemo(()=>new Map(session.retainedRowNumbers.map((row,index)=>[row,session.workingRows[index]])),[session]);
 const applied=session.appliedFixes.length>0;
 const appliedIds=useMemo(()=>new Set(session.appliedFixes.map(fix=>fix.issueId)),[session.appliedFixes]);
 const removedIds=useMemo(()=>new Set(session.removedRows),[session.removedRows]);
 const remainingFixes=session.safeFixes.filter(fix=>!appliedIds.has(fix.issueId)&&!removedIds.has(fix.row));
 const invalid=session.unresolvedIssues.filter(issue=>issue.type==='invalid_email').length;
 const missing=session.unresolvedIssues.filter(issue=>issue.type.startsWith('missing_')).length;
 const previewRows=preview==='original'?session.originalCsv.rows:session.workingRows;
 const previewNumbers=preview==='original'?undefined:session.retainedRowNumbers;
 function download(){try{downloadCleanedCsv(session,fileName);setDownloadError('')}catch{setDownloadError('This CSV could not be prepared for download. Try again.')}}
 return <section className="crm-cleaning" aria-label="Clean your CSV">
 <h3>Clean your CSV</h3><p className="muted">Apply suggested changes, review duplicates, then download. Your original data stays unchanged.</p>
 <dl className="health-summary"><div><dt>Safe fixes</dt><dd>{number.format(remainingFixes.length)} available</dd></div><div><dt>Duplicate groups</dt><dd>{number.format(groups.length-reviewed)} to review</dd></div><div><dt>Manual issues</dt><dd>{number.format(invalid+missing)}</dd></div></dl>
 <div className="cleaning-actions"><button type="button" className="button" disabled={!remainingFixes.length} onClick={()=>onChange(applySafeFixes(session))}>Apply safe fixes</button><button type="button" className="button secondary" onClick={()=>setReview(value=>!value)} aria-expanded={review}>Review duplicates</button>{applied&&<button type="button" className="button secondary" onClick={()=>onChange(undoSafeFixes(session))}>Undo safe fixes</button>}<button type="button" className="report-more" disabled={!applied&&!reviewed} onClick={()=>{onChange(resetChanges(session));setDownloadError('')}}>Reset changes</button></div>
 <p className="cleaning-feedback" role="status">{number.format(session.appliedFixes.length)} fixes applied{session.removedRows.length?' · '+number.format(session.removedRows.length)+' rows excluded from export':''}</p>
 <details className="issue-section"><summary><span>Change preview</span><span>{number.format(session.safeFixes.length)} suggestions</span></summary><ul className="row-issues">{session.safeFixes.slice(0,fixLimit).map(fix=><li key={fix.issueId} className="row-issue"><div className="row-issue-heading"><strong>{issueDefinitions[fix.type].label}</strong><span>Row {fix.row} · {fix.columnName}</span></div><p className="fix-comparison"><code>{fix.before}</code><span>→</span><code>{fix.after}</code></p><span className="muted">{removedIds.has(fix.row)?'Row excluded from export':appliedIds.has(fix.issueId)?'Applied':'Suggested only'}</span></li>)}</ul>{session.safeFixes.length>fixLimit&&<button className="report-more" type="button" onClick={()=>setFixLimit(value=>value+20)}>Show more changes</button>}{!session.safeFixes.length&&<p>No safe fixes suggested.</p>}</details>
 {review&&<section className="duplicate-review" aria-label="Duplicate review"><h4>Duplicate review</h4><p role="status">{reviewed} of {groups.length} reviewed</p>{groups.slice(0,groupLimit).map(group=><ReviewGroup key={group.id} group={group} session={session} onChange={onChange} values={values}/>)}{groups.length>groupLimit&&<button className="report-more" type="button" onClick={()=>setGroupLimit(value=>value+20)}>Show 20 more groups</button>}{!groups.length&&<p>No duplicate groups found.</p>}</section>}
 <div className="manual-review"><h4>Needs manual review</h4><p>{number.format(invalid)} invalid emails · {number.format(missing)} missing values in retained rows</p><p className="muted">These values are unchanged. Phone formatting remains a suggestion.</p></div>
 <section className="cleaned-preview"><h4>Data preview</h4><div className="preview-switch" role="group" aria-label="Choose data preview"><button type="button" aria-pressed={preview==='original'} onClick={()=>setPreview('original')}>Original data</button><button type="button" aria-pressed={preview==='cleaned'} onClick={()=>setPreview('cleaned')}>Cleaned data</button></div>
 <div className="csv-table-scroll" tabIndex={0} role="region" aria-label={preview==='original'?'Original data preview':'Cleaned data preview'}><table><caption className="sr-only">{preview==='original'?'Original':'Cleaned'} data, first 20 retained records. Row numbers refer to the original file.</caption><thead><tr><th scope="col">Original row</th>{session.originalCsv.columns.map(column=><th key={column.key} scope="col">{column.name}</th>)}</tr></thead><tbody>{previewRows.slice(0,20).map((row,index)=><tr key={previewNumbers?.[index]??index}><th scope="row">{previewNumbers?.[index]??index+1}</th>{session.originalCsv.columns.map(column=><td key={column.key}>{row[column.key]===''?<span className="empty-cell">—</span>:row[column.key]}</td>)}</tr>)}</tbody></table></div><p className="preview-count">Showing {Math.min(20,previewRows.length)} of {number.format(previewRows.length)} rows</p></section>
 <section className="export-summary"><h4>Ready to export</h4><dl className="export-counts"><div><dt>Original rows</dt><dd>{number.format(session.originalCsv.rows.length)}</dd></div><div><dt>Rows after duplicate decisions</dt><dd>{number.format(session.workingRows.length)}</dd></div><div><dt>Safe fixes applied</dt><dd>{number.format(session.appliedFixes.length)}</dd></div><div><dt>Rows removed</dt><dd>{number.format(session.removedRows.length)}</dd></div><div><dt>Unresolved issues</dt><dd>{number.format(session.unresolvedIssues.length)}</dd></div></dl>
 <p className="muted">Unresolved issues are original findings on retained rows, excluding applied fixes and reviewed duplicate groups. Counts can overlap on a contact.</p>
 {groups.length>reviewed&&<p>{groups.length-reviewed} duplicate groups are still unreviewed. Unreviewed duplicates will be kept.</p>}
 <button type="button" className="button" onClick={download}>Download cleaned CSV</button>{downloadError&&<p role="alert" className="file-error">{downloadError}</p>}<p className="muted">UTF-8 CSV with the original columns and delimiter. Only your chosen changes are included.</p>
 </section></section>;
}

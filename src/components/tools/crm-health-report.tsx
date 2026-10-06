'use client';
import { DuplicateDifferences } from './duplicate-differences';
import { detectEmailColumns } from '@/lib/crm/detect-email-columns';
import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ParsedCsv } from '@/lib/csv/types';
import { duplicateMatchReasons, issueDefinitions, type CrmAnalysis, type CrmIssue, type DuplicateGroup, type IssueCategory } from '@/lib/crm/types';
const format=new Intl.NumberFormat('en');
const categories:readonly {id:IssueCategory;label:string}[]=[{id:'duplicates',label:'Duplicates'},{id:'email',label:'Invalid emails'},{id:'missing',label:'Missing information'},{id:'formatting',label:'Formatting'}];
function SeverityBadge({severity}:{severity:CrmIssue['severity']}){return <span className={'issue-severity '+severity}>{severity}</span>}
function DuplicateDetails({group,csv}:{group:DuplicateGroup;csv:ParsedCsv}){
  const [open,setOpen]=useState(false);
  const [limit,setLimit]=useState(20);
  const [matchLimit,setMatchLimit]=useState(30);
  return <details className="duplicate-detail" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary><span>{group.kind==='exact'?'Exact duplicate':'Likely duplicate'} group #{group.id.split('-').at(-1)}</span><span className="issue-row-label">{format.format(group.rows.length)} rows</span><SeverityBadge severity={group.kind==='exact'?'error':'warning'}/></summary>
    {open&&<div className="duplicate-body">
      <p className="muted">{group.kind==='exact'?'Every column matches after trimming.':'This group connects matching pairs. A shared signal is evidence to review, not proof of identity.'} No row is removed automatically.</p>
      {group.kind==='likely'&&group.exactSubgroups.map(rows=><p className="exact-subgroup" key={rows[0]}><strong>Exact duplicates within this group:</strong> Rows {rows.join(', ')}</p>)}
      <h5>Match reasons</h5>
      <ul className="duplicate-reasons">{group.matches.slice(0,matchLimit).map(match=><li key={match.rows.join('-')}><strong>Rows {match.rows[0]} &amp; {match.rows[1]}</strong><span>{duplicateMatchReasons(match).join(' ')}</span></li>)}</ul>
      {group.matches.length>matchLimit&&<button type="button" className="report-more" onClick={()=>setMatchLimit(value=>value+30)}>Show more match reasons ({format.format(group.matches.length-matchLimit)} remaining)</button>}
      <DuplicateDifferences group={group}/><h5>Original records</h5><div className="csv-table-scroll" tabIndex={0} role="region" aria-label={'Original values for '+group.id}><table><thead><tr><th scope="col">Data row</th>{csv.columns.map(column=><th scope="col" key={column.key}>{column.name}</th>)}</tr></thead><tbody>{group.rows.slice(0,limit).map(rowNumber=><tr key={rowNumber}><th scope="row">{rowNumber}</th>{csv.columns.map(column=><td key={column.key}>{csv.rows[rowNumber-1][column.key]===''?<span className="empty-cell">—</span>:csv.rows[rowNumber-1][column.key]}</td>)}</tr>)}</tbody></table></div>
      <p className="preview-count">Showing {Math.min(limit,group.rows.length)} of {format.format(group.rows.length)} affected records</p>
      {group.rows.length>limit&&<button type="button" className="report-more" onClick={()=>setLimit(value=>value+20)}>Show 20 more records</button>}
    </div>}
  </details>;
}
function RowIssue({issue}:{issue:CrmIssue}){
  const value=issue.originalValues[0]?.value;
  const original=typeof value==='string'?value:'';
  return <li className="row-issue"><div className="row-issue-heading"><strong>{issueDefinitions[issue.type].label}</strong><span className="issue-row-label">Row {issue.rows[0]}</span><SeverityBadge severity={issue.severity}/></div>
    <div className="issue-value"><span>{issue.columnName??issue.field}</span><span aria-hidden="true">→</span><code>{original===''?'Empty':original.trim()===''?'Whitespace only ('+original.length+' characters)':original}</code></div>
    <p>{issue.reason}</p>{issue.suggestedValue!==undefined&&<p className="issue-suggestion"><strong>Suggested only:</strong> <code>{issue.suggestedValue}</code></p>}
  </li>;
}
function IssueSection({category,analysis,csv}:{category:typeof categories[number];analysis:CrmAnalysis;csv:ParsedCsv}){
  const [open,setOpen]=useState(false);
  const [limit,setLimit]=useState(30);
  const issues=analysis.issues.filter(issue=>issueDefinitions[issue.type].category===category.id);
  const count=category.id==='duplicates'?analysis.duplicateGroups.length:issues.length;
  const items=category.id==='duplicates'?analysis.duplicateGroups:issues;
  const types=Object.entries(analysis.counts).filter(([type,count])=>count>0&&issueDefinitions[type as CrmIssue['type']].category===category.id);
  return <details className="issue-section" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary><span>{category.label}</span><span>{format.format(count)}{category.id==='duplicates'?' groups':''}</span></summary>
    {open&&<div className="issue-section-body">
      {types.length>0&&<div className="issue-type-counts">{types.map(([type,count])=><span key={type}>{issueDefinitions[type as CrmIssue['type']].label}: {format.format(count)}</span>)}</div>}
      {!count?<p className="muted">No issues of this type detected by the current rules.</p>:category.id==='duplicates'?analysis.duplicateGroups.slice(0,limit).map(group=><DuplicateDetails key={group.id} group={group} csv={csv}/>):<ul className="row-issues">{issues.slice(0,limit).map(issue=><RowIssue key={issue.id} issue={issue}/>)}</ul>}
      {items.length>limit&&<button type="button" className="report-more" onClick={()=>setLimit(value=>value+30)}>Show 30 more ({format.format(items.length-limit)} remaining)</button>}
    </div>}
  </details>;
}
export function CrmHealthReport({analysis,csv}:{analysis:CrmAnalysis;csv:ParsedCsv}){
  const missing=analysis.counts.missing_company+analysis.counts.missing_location+analysis.counts.missing_email+analysis.counts.missing_phone;
  const formatting=analysis.counts.email_case+analysis.counts.name_capitalization+analysis.counts.phone_format;
  return <section className="crm-health" aria-label="Data health report">
    <div className="health-heading"><ShieldCheck size={20} aria-hidden="true"/><h3>Data health</h3></div>
    <p className="health-intro">{format.format(analysis.contacts)} contacts · {format.format(analysis.issues.length)} findings across {format.format(analysis.affectedRows)} data rows</p>
    <p className="muted">Email columns checked: {detectEmailColumns(csv.columns).length}</p><dl className="health-summary"><div><dt>Duplicate groups</dt><dd>{format.format(analysis.duplicateGroups.length)}</dd></div><div><dt>Invalid emails</dt><dd>{format.format(analysis.counts.invalid_email)}</dd></div><div><dt>Missing values</dt><dd>{format.format(missing)}</dd></div><div><dt>Formatting issues</dt><dd>{format.format(formatting)}</dd></div></dl>
    <div className="missing-breakdown"><span>Missing company: {analysis.counts.missing_company}</span><span>Missing location: {analysis.counts.missing_location}</span><span>Missing email: {analysis.counts.missing_email}</span><span>Missing phone: {analysis.counts.missing_phone}</span></div>
    {analysis.issues.length===0&&<p className="health-clean"><CheckCircle2 size={17} aria-hidden="true"/>No issues found by the current rules.</p>}
    <h4>Issues found</h4><p className="health-disclaimer">Data rows start at 1, after the header. Findings may overlap on the same contact. This report describes the original file; applied changes appear in Clean your CSV.</p>
    <div className="issue-sections">{categories.map(category=><IssueSection key={category.id} category={category} analysis={analysis} csv={csv}/>)}</div>
  </section>;
}

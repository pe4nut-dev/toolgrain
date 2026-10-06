import type { ParsedCsv } from '../../csv/types';
import type { CrmAnalysis } from '../types';
import type { CleaningSession, SafeFix } from './types';
export const SAFE_AUTO_FIXES = ['email_case','name_capitalization'] as const;
export function safeFixSuggestions(csv:ParsedCsv,analysis:CrmAnalysis):SafeFix[]{
 return analysis.issues.flatMap(issue=>{
  if(!SAFE_AUTO_FIXES.some(type=>type===issue.type)||issue.suggestedValue===undefined||!issue.columnKey)return [];
  const column=csv.columns.find(column=>column.key===issue.columnKey);
  const row=issue.rows[0],before=csv.rows[row-1]?.[issue.columnKey];
  if(!column||before===undefined||before===issue.suggestedValue)return [];
  return [{issueId:issue.id,type:issue.type as SafeFix['type'],row,columnKey:column.key,columnName:column.name,before,after:issue.suggestedValue}];
 });
}
/** Rebuild only on explicit decisions, never during render. Originals are frozen. */
export function rebuildSession(session:CleaningSession):CleaningSession{
 const removed=new Set<number>();
 for(const group of session.analysis.duplicateGroups){const decision=session.duplicateDecisions[group.id];if(decision?.kind==='keep_row')for(const row of group.rows)if(row!==decision.row)removed.add(row)}
 const applied=new Map<string,SafeFix[]>();
 for(const fix of session.appliedFixes){const key=String(fix.row);const list=applied.get(key)??[];list.push(fix);applied.set(key,list)}
 const workingRows:ParsedCsv['rows']=[],retainedRowNumbers:number[]=[];
 session.originalCsv.rows.forEach((row,index)=>{const number=index+1;if(removed.has(number))return;const copy={...row};for(const fix of applied.get(String(number))??[])copy[fix.columnKey]=fix.after;workingRows.push(copy);retainedRowNumbers.push(number)});
 const appliedIds=new Set(session.appliedFixes.map(fix=>fix.issueId));
 const unresolvedIssues=session.analysis.issues.filter(issue=>!appliedIds.has(issue.id)&&issue.rows.some(row=>!removed.has(row))&&(!issue.duplicateGroupId||!session.duplicateDecisions[issue.duplicateGroupId]));
 return {...session,workingRows,retainedRowNumbers,removedRows:[...removed].sort((a,b)=>a-b),unresolvedIssues};
}
export function createCleaningSession(csv:ParsedCsv,analysis:CrmAnalysis):CleaningSession{
 const originalCsv:ParsedCsv={...csv,columns:csv.columns.map(column=>Object.freeze({...column})),rows:csv.rows.map(row=>Object.freeze({...row})),warnings:[...csv.warnings]};
 Object.freeze(originalCsv.rows);Object.freeze(originalCsv.columns);Object.freeze(originalCsv.warnings);Object.freeze(originalCsv);
 return rebuildSession({originalCsv,analysis,safeFixes:safeFixSuggestions(originalCsv,analysis),appliedFixes:[],duplicateDecisions:{},workingRows:[],retainedRowNumbers:[],removedRows:[],unresolvedIssues:[]});
}
export function applySafeFixes(session:CleaningSession):CleaningSession {
 const removed=new Set(session.removedRows),existing=new Set(session.appliedFixes.map(fix=>fix.issueId));
 const additions=session.safeFixes.filter(fix=>!removed.has(fix.row)&&!existing.has(fix.issueId));
 return rebuildSession({...session,appliedFixes:[...session.appliedFixes,...additions]});
}
export function undoSafeFixes(session:CleaningSession):CleaningSession {return rebuildSession({...session,appliedFixes:[]})}
export function resetChanges(session:CleaningSession):CleaningSession {return rebuildSession({...session,appliedFixes:[],duplicateDecisions:{}})}

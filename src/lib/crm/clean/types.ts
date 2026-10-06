import type { ParsedCsv } from '../../csv/types';
import type { CrmAnalysis, CrmIssue } from '../types';
export type SafeFix = {issueId:string;type:'email_case'|'name_capitalization';row:number;columnKey:string;columnName:string;before:string;after:string};
export type DuplicateDecision = {kind:'keep_all'} | {kind:'keep_row';row:number};
export type CleaningSession = {
 originalCsv:ParsedCsv;
 analysis:CrmAnalysis;
 safeFixes:readonly SafeFix[];
 appliedFixes:readonly SafeFix[];
 duplicateDecisions:Readonly<Record<string,DuplicateDecision>>;
 workingRows:ParsedCsv['rows'];
 retainedRowNumbers:number[];
 removedRows:number[];
 unresolvedIssues:CrmIssue[];
};

import type { CrmFieldType, CsvRow } from '../csv/types';
export type CrmIssueType = 'exact_duplicate' | 'likely_duplicate' | 'invalid_email' | 'email_case' | 'missing_company' | 'missing_location' | 'missing_email' | 'missing_phone' | 'name_capitalization' | 'phone_format';
export type Severity = 'error' | 'warning' | 'suggestion';
export type IssueCategory = 'duplicates' | 'email' | 'missing' | 'formatting';
export const issueDefinitions: Record<CrmIssueType, {label: string; severity: Severity; category: IssueCategory}> = {
  exact_duplicate: {label:'Exact duplicate',severity:'error',category:'duplicates'},
  likely_duplicate: {label:'Likely duplicate',severity:'warning',category:'duplicates'},
  invalid_email: {label:'Invalid email',severity:'error',category:'email'},
  email_case: {label:'Email capitalization',severity:'suggestion',category:'formatting'},
  missing_company: {label:'Missing company',severity:'warning',category:'missing'},
  missing_location: {label:'Missing location',severity:'warning',category:'missing'},
  missing_email: {label:'Missing email',severity:'warning',category:'missing'},
  missing_phone: {label:'Missing phone',severity:'warning',category:'missing'},
  name_capitalization: {label:'Inconsistent name capitalization',severity:'suggestion',category:'formatting'},
  phone_format: {label:'Inconsistent phone formatting',severity:'suggestion',category:'formatting'},
};
export type CrmIssue = {
  id: string;
  type: CrmIssueType;
  severity: Severity;
  rows: number[]; // One-based data records, excluding the header.
  field: CrmFieldType | 'record';
  columnName?: string;
  columnKey?: string;
  originalValues: {row:number; value:string | CsvRow}[];
  suggestedValue?: string;
  reason: string;
  duplicateGroupId?: string;
};
export type DuplicateDetectionConfig = { mode?: 'automatic' | 'specific'; selectedColumns?: readonly string[]; customKeyColumn?: string; normalizeGermanText?: boolean };
export type DuplicateReason = 'exact_values' | 'email' | 'phone' | 'name_company' | 'custom_key';
export const duplicateReasons: Record<DuplicateReason,string> = {
  custom_key:'Same non-empty value in the selected duplicate key column.',
  exact_values:'All column values match after trimming.',
  email:'Same email after trimming and case normalization.',
  phone:'Same phone after removing presentation separators. Country prefixes are not inferred.',
  name_company:'Same name and company after comparison normalization (spacing, transliteration and common company suffixes).',
};
export type CustomKeyMatch = { columnKey: string; columnName: string; value: string };
export type DuplicateMatch = {rows:[number,number]; reasons:DuplicateReason[]; customKey?: CustomKeyMatch; selectedKey?: CustomKeyMatch[]; textNormalized?: boolean};
export function duplicateMatchReasons(match: DuplicateMatch): string[] {
 return match.reasons.map(reason => reason === 'custom_key' && match.selectedKey
  ? (match.textNormalized ? 'Same selected key after text normalization: ' : 'Same selected duplicate key: ') + match.selectedKey.map(part => part.columnName + ' = ' + part.value).join('; ')
  : reason === 'custom_key' && match.customKey
  ? 'Same value in selected duplicate key column "' + match.customKey.columnName + '". Value: ' + match.customKey.value
  : duplicateReasons[reason]);
}
export type DuplicateGroup = {
  id:string;
  kind:'exact'|'likely';
  rows:number[];
  matches:DuplicateMatch[];
  exactSubgroups:number[][];
  selectedKey?: CustomKeyMatch[];
  textNormalized?: boolean;
  differences?: {columnKey:string; columnName:string; values:{row:number; value:string}[]}[];
};
export type CrmAnalysis = {
  issues:CrmIssue[];
  duplicateGroups:DuplicateGroup[];
  counts:Record<CrmIssueType,number>;
  affectedRows:number;
  contacts:number;
};

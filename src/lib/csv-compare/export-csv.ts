import Papa from 'papaparse';
import type { ParsedCsv } from '../csv/types';
import type { ComparisonResult } from './types';
export type ExportCategory = 'added' | 'removed' | 'changed' | 'issues';
export type CsvExport = { csv: string; filename: string; rowCount: number; delimiter: string };
export function exportFilename(source: string, suffix: string): string {
 const leaf = source.split(/[\\/]/).at(-1) ?? '';
 const stem = leaf.replace(/\.csv$/i, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0,180);
 return (stem || 'comparison') + '-' + suffix + '.csv';
}
// Reuse delimiters supported by the generic parser; otherwise fall back to comma.
export function exportDelimiter(delimiter: string): string { return [',',';','\t'].includes(delimiter) ? delimiter : ','; }
export function createComparisonExport(category: ExportCategory, result: ComparisonResult, oldCsv: ParsedCsv, newCsv: ParsedCsv, oldFilename: string, newFilename: string): CsvExport | null {
 const source = category === 'removed' ? oldCsv : newCsv;
 const filename = exportFilename(category === 'removed' ? oldFilename : newFilename, category === 'issues' ? 'key-issues' : category);
 let fields: string[], data: string[][];
 if (category === 'added' || category === 'removed') {
  fields = source.columns.map(c=>c.name);
  data = result[category].map(record=>source.columns.map(c=>record.row[c.key] ?? ''));
 } else if (category === 'changed') {
  fields = ['key','column','old_value','new_value'];
  data = result.changed.flatMap(record=>record.changes.map(change=>[record.key,change.column,change.oldValue,change.newValue]));
 } else {
  fields = ['issue_type','file','key','record_numbers','details'];
  data = result.issues.flatMap(issue=>(['old','new'] as const).flatMap(file=>{
   const rows = file === 'old' ? issue.oldRows : issue.newRows;
   if (!rows.length) return [];
   const missing = issue.reason === 'missing', duplicate = rows.length > 1;
   return [[missing ? 'missing_key' : duplicate ? 'duplicate_key' : 'ambiguous_key', file, issue.key, rows.map(r=>r.rowNumber).join(';'), missing ? 'Key value is empty' : duplicate ? 'Key occurs more than once in this file; all records for this key are excluded' : 'Excluded because this key occurs more than once in the other file']];
  }));
 }
 if (!data.length) return null;
 const delimiter = exportDelimiter(source.delimiter);
 return { csv: '\uFEFF' + Papa.unparse({fields,data},{delimiter,newline:'\r\n',skipEmptyLines:false}), filename, rowCount:data.length, delimiter };
}
export function downloadComparisonExport(report: CsvExport): void {
 const url = URL.createObjectURL(new Blob([report.csv], {type:'text/csv;charset=utf-8'}));
 const link = document.createElement('a');link.href=url;link.download=report.filename;document.body.append(link);
 try { link.click(); } finally { link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
}

import type { CsvColumn, CsvRow } from '../csv/types';
export type RowRef = { row: CsvRow; rowNumber: number };
export type SharedColumn = { name: string; oldColumn: CsvColumn; newColumn: CsvColumn };
export type SchemaAnalysis = { shared: SharedColumn[]; onlyOld: string[]; onlyNew: string[]; ambiguous: string[] };
export type MatchedRecord = { key: string; oldRow: RowRef; newRow: RowRef };
export type ChangedRecord = MatchedRecord & { changes: { column: string; oldValue: string; newValue: string }[] };
export type SingleRecord = RowRef & { key: string };
export type KeyIssue = { reason: 'missing' | 'duplicate'; key: string; oldRows: RowRef[]; newRows: RowRef[]; duplicateIn?: 'old' | 'new' | 'both' };
export type ComparisonResult = { added: SingleRecord[]; removed: SingleRecord[]; changed: ChangedRecord[]; unchanged: MatchedRecord[]; issues: KeyIssue[]; schema: SchemaAnalysis; oldKey: CsvColumn; newKey: CsvColumn };

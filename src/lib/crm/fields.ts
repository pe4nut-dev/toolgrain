import type { CrmFieldType, CsvColumn, CsvRow, DetectedColumn } from '../csv/types';
export type FieldColumns = Record<CrmFieldType, readonly CsvColumn[]>;
export function fieldColumns(detected: readonly DetectedColumn[]): FieldColumns {
  const fields:FieldColumns={first_name:[],last_name:[],full_name:[],company:[],email:[],phone:[],location:[]};
  for (const item of detected) fields[item.field]=item.columns;
  return fields;
}
export function firstValue(row: CsvRow, columns: readonly CsvColumn[]): string {
  return columns.map(column=>row[column.key]??'').find(value=>value.trim())??'';
}

/** Missing means absent or blank, independent of validation and normalization. */
export function isMissingValue(value: string | null | undefined): boolean {
  return value === undefined || value === null || value.trim() === "";
}

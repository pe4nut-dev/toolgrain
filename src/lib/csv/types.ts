export type CsvRow = Record<string, string>;
export type CsvColumn = { key: string; name: string };
export type ParsedCsv = {
  columns: CsvColumn[];
  rows: CsvRow[];
  delimiter: string;
  warnings: string[];
};
export type CrmFieldType = 'first_name' | 'last_name' | 'full_name' | 'company' | 'email' | 'phone' | 'location';
export type DetectedColumn = { field: CrmFieldType; label: string; columns: CsvColumn[] };

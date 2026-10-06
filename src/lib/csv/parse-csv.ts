import Papa from 'papaparse';
import type { CsvRow, ParsedCsv } from './types';
const messages = {
  empty: 'This CSV does not contain any data.',
  header: "We couldn't detect a valid header row.",
  parse: 'Something went wrong while reading this CSV.',
};
export class CsvError extends Error {
  constructor(public readonly code: keyof typeof messages) { super(messages[code]); this.name = 'CsvError'; }
}

export function parseCsvText(text: string): ParsedCsv {
  if (!text.replace(/^\uFEFF/, '').trim()) throw new CsvError('empty');
  if (text.includes('\u0000')) throw new CsvError('parse');
  // Stable internal keys preserve duplicate and special names without modifying
  // the original header labels. Papa may call transformHeader more than once.
  const headerNames: string[] = [];
  const result = Papa.parse<CsvRow>(text, {
    header: true,
    delimiter: '',
    delimitersToGuess: [',', ';', '\t'],
    dynamicTyping: false,
    skipEmptyLines: true,
    transformHeader: (name, index) => { headerNames[index] ??= name; return 'column_' + index; },
  });
  const keys = result.meta.fields ?? [];
  const columns = keys.map((key, index) => ({ key, name: headerNames[index] ?? '' }));
  // CSV has no reliable header marker. Use its first row, rejecting blank or
  // entirely numeric labels; don't require a known CRM column.
  if (!columns.length || columns.some(column => !column.name.trim()) ||
      columns.every(column => /^[+\-]?[\d.]+$/.test(column.name.trim()))) throw new CsvError('header');
  if (result.errors.some(error => error.code !== 'UndetectableDelimiter')) throw new CsvError('parse');
  if (!result.data.length) throw new CsvError('empty');
  const duplicateNames = new Set<string>();
  const seen = new Set<string>();
  for (const column of columns) {
    if (seen.has(column.name)) duplicateNames.add(column.name);
    seen.add(column.name);
  }
  // No value transforms or type coercion. A delimiter-only record is retained.
  return { columns, rows: result.data, delimiter: result.meta.delimiter, warnings: duplicateNames.size ? ['Some columns have duplicate names.'] : [] };
}

export function parseCsvFile(file: File, signal?: AbortSignal): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const abort = () => { reader.abort(); cleanup(); reject(new DOMException('Analysis cancelled', 'AbortError')); };
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    reader.onload = () => {
      cleanup();
      try {
        if (signal?.aborted) { reject(new DOMException('Analysis cancelled', 'AbortError')); return; }
        if (typeof reader.result !== 'string') throw new CsvError('parse');
        resolve(parseCsvText(reader.result));
      } catch (error) { reject(error instanceof CsvError ? error : new CsvError('parse')); }
    };
    reader.onerror = () => { cleanup(); reject(new CsvError('parse')); };
    reader.onabort = () => { cleanup(); reject(new DOMException('Analysis cancelled', 'AbortError')); };
    reader.readAsText(file, 'UTF-8');
  });
}

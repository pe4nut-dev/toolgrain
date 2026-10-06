import type { CsvRow } from '../csv/types';
import type { RowRef } from './types';
export function analyzeKeys(rows: CsvRow[], columnKey: string) {
  const groups = new Map<string, RowRef[]>(), missing: RowRef[] = [];
  rows.forEach((row, index) => {
    // Row numbers identify parsed records (header is record 1), not physical lines.
    const ref = { row, rowNumber: index + 2 }, key = (row[columnKey] ?? '').trim();
    if (!key) { missing.push(ref); return; }
    const group = groups.get(key); if (group) group.push(ref); else groups.set(key, [ref]);
  });
  return { groups, missing };
}

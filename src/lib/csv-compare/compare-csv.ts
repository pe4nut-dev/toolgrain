import type { ParsedCsv } from '../csv/types';
import { analyzeKeys } from './key-analysis';
import { analyzeSchema } from './schema-analysis';
import type { ComparisonResult } from './types';
export function compareCsv(old: ParsedCsv, next: ParsedCsv, oldColumnKey: string, newColumnKey: string): ComparisonResult {
  const oldKey = old.columns.find(c => c.key === oldColumnKey), newKey = next.columns.find(c => c.key === newColumnKey);
  if (!oldKey || !newKey) throw new Error('Choose a valid key column for each file.');
  const schema = analyzeSchema(old.columns, next.columns);
  const columns = schema.shared.filter(c => c.oldColumn.key !== oldKey.key && c.newColumn.key !== newKey.key);
  const a = analyzeKeys(old.rows, oldKey.key), b = analyzeKeys(next.rows, newKey.key);
  const result: ComparisonResult = { added: [], removed: [], changed: [], unchanged: [], issues: [], schema, oldKey, newKey };
  if (a.missing.length) result.issues.push({ reason: 'missing', key: '', oldRows: a.missing, newRows: [] });
  if (b.missing.length) result.issues.push({ reason: 'missing', key: '', oldRows: [], newRows: b.missing });
  for (const key of new Set([...a.groups.keys(), ...b.groups.keys()])) {
    const oldRows = a.groups.get(key) ?? [], newRows = b.groups.get(key) ?? [];
    if (oldRows.length > 1 || newRows.length > 1) {
      result.issues.push({ reason: 'duplicate', key, oldRows, newRows, duplicateIn: oldRows.length > 1 ? (newRows.length > 1 ? 'both' : 'old') : 'new' });
      continue;
    }
    if (!oldRows.length) { result.added.push({ key, ...newRows[0] }); continue; }
    if (!newRows.length) { result.removed.push({ key, ...oldRows[0] }); continue; }
    const record = { key, oldRow: oldRows[0], newRow: newRows[0] };
    const changes = columns.flatMap(c => {
      const oldValue = record.oldRow.row[c.oldColumn.key] ?? '', newValue = record.newRow.row[c.newColumn.key] ?? '';
      return oldValue === newValue ? [] : [{ column: c.name, oldValue, newValue }];
    });
    if (changes.length) result.changed.push({ ...record, changes }); else result.unchanged.push(record);
  }
  return result;
}

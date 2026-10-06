import type { CsvColumn } from '../csv/types';
import type { SchemaAnalysis } from './types';
function groupColumns(columns: CsvColumn[]) {
  const groups = new Map<string, CsvColumn[]>();
  for (const column of columns) { const group = groups.get(column.name); if (group) group.push(column); else groups.set(column.name, [column]); }
  return groups;
}
export function analyzeSchema(oldColumns: CsvColumn[], newColumns: CsvColumn[]): SchemaAnalysis {
  const old = groupColumns(oldColumns), next = groupColumns(newColumns);
  const shared: SchemaAnalysis['shared'] = [], onlyOld: string[] = [], onlyNew: string[] = [], ambiguous: string[] = [];
  for (const name of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(name), b = next.get(name);
    if ((a?.length ?? 0) > 1 || (b?.length ?? 0) > 1) { ambiguous.push(name); continue; }
    if (a && b) shared.push({ name, oldColumn: a[0], newColumn: b[0] });
    else if (a) onlyOld.push(name); else onlyNew.push(name);
  }
  return { shared, onlyOld, onlyNew, ambiguous };
}

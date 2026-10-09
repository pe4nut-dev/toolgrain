import { afterEach, describe, expect, it, vi } from 'vitest';
import { crmSampleCsv, compareOriginalSampleCsv, compareUpdatedSampleCsv, createCrmSampleFile, createCompareSampleFiles } from '../src/lib/csv/sample-data';
import { parseCsvFile, parseCsvText } from '../src/lib/csv/parse-csv';
import { detectColumns } from '../src/lib/csv/detect-columns';
import { analyzeCrm } from '../src/lib/crm/analyze-crm';
import { createCleaningSession, applySafeFixes, undoSafeFixes } from '../src/lib/crm/clean/apply-fixes';
import { decideDuplicate, unreviewDuplicate } from '../src/lib/crm/clean/duplicate-decisions';
import { exportCleanedCsv } from '../src/lib/crm/clean/export-csv';
import { compareCsv } from '../src/lib/csv-compare/compare-csv';
import { createComparisonExport } from '../src/lib/csv-compare/export-csv';
import { rowViolation, fileSizeViolation } from '../src/lib/entitlements';

const contacts = parseCsvText(crmSampleCsv);
const health = analyzeCrm(contacts, detectColumns(contacts.columns));
const original = parseCsvText(compareOriginalSampleCsv), updated = parseCsvText(compareUpdatedSampleCsv);
const comparison = compareCsv(original, updated, 'column_0', 'column_0');
afterEach(() => vi.unstubAllGlobals());
describe('fictional samples through existing engines', () => {
  it('loads all three bundled Files through the real upload parser', async () => {
    class Reader {
      result: string | null = null; onload?: () => void; onerror?: () => void; onabort?: () => void;
      readAsText(file: File) { void file.text().then(text => { this.result = text; this.onload?.(); }); }
      abort() { this.onabort?.(); }
    }
    vi.stubGlobal('FileReader', Reader);
    const files = createCompareSampleFiles();
    expect((await parseCsvFile(createCrmSampleFile())).rows).toHaveLength(20);
    expect((await parseCsvFile(files.old)).rows).toHaveLength(18);
    expect((await parseCsvFile(files.new)).rows).toHaveLength(18);
  });
  it('demonstrates exact and near duplicates without automatic deletion', () => {
    expect(health.duplicateGroups.some(group => group.kind === 'exact')).toBe(true);
    expect(health.duplicateGroups.some(group => group.kind === 'likely')).toBe(true);
    expect(createCleaningSession(contacts, health).workingRows).toHaveLength(20);
  });
  it('demonstrates detectable invalid emails, missing fields and formatting', () => {
    expect(health.counts.invalid_email).toBe(2);
    for (const type of ['missing_company', 'missing_location', 'email_case', 'name_capitalization', 'phone_format'] as const) expect(health.counts[type]).toBeGreaterThan(0);
  });
  it('applies and undoes safe corrections without mutating originals or identifiers', () => {
    const snapshot = JSON.stringify(contacts), session = createCleaningSession(contacts, health);
    const corrected = applySafeFixes(session);
    expect(corrected.appliedFixes.length).toBeGreaterThan(0);
    expect(corrected.workingRows.map(row => row.column_6)).toEqual(contacts.rows.map(row => row.column_6));
    expect(corrected.workingRows[0].column_4).toBe('00123456789');
    expect(undoSafeFixes(corrected).workingRows).toEqual(session.workingRows);
    expect(JSON.stringify(contacts)).toBe(snapshot);
  });
  it('keeps duplicate decisions explicit and reversible', () => {
    const session = createCleaningSession(contacts, health), group = health.duplicateGroups.find(group => group.kind === 'exact')!;
    const reviewed = decideDuplicate(session, group.id, { kind: 'keep_row', row: group.rows[0] });
    expect(reviewed.workingRows).toHaveLength(19);
    expect(unreviewDuplicate(reviewed, group.id).workingRows).toHaveLength(20);
  });
  it('roundtrips corrected CRM exports, quoted commas, phone zeros and long IDs', () => {
    const corrected = applySafeFixes(createCleaningSession(contacts, health));
    const parsed = parseCsvText(exportCleanedCsv(corrected));
    expect(parsed.rows).toEqual(corrected.workingRows);
    expect(parsed.rows[15].column_2).toBe('Example, Atelier');
    expect(parsed.rows[15].column_6).toBe('123456789012345678901234567890');
    expect(parsed.rows[0].column_4).toBe('00123456789');
  });
  it('finds added, removed, changed and unchanged catalog records by selected SKU', () => {
    expect(comparison.added).toHaveLength(1); expect(comparison.removed).toHaveLength(1);
    expect(comparison.changed).toHaveLength(3); expect(comparison.unchanged).toHaveLength(14);
    expect(comparison.issues).toHaveLength(0);
    expect(comparison.changed.flatMap(record => record.changes.map(change => change.column)).sort()).toEqual(['price', 'product_name', 'stock']);
  });
  it('does not classify reordered unchanged records as content changes', () => {
    expect(updated.rows[0].column_0).not.toBe(original.rows[0].column_0);
    expect(comparison.unchanged.find(record => record.key === '00000018')).toBeDefined();
    expect(compareCsv(original, original, 'column_0', 'column_0').unchanged).toHaveLength(18);
  });
  it('roundtrips comparison exports with leading zeros and long numeric-looking keys', () => {
    for (const kind of ['added', 'removed', 'changed'] as const) {
      const report = createComparisonExport(kind, comparison, original, updated, 'original.csv', 'updated.csv')!;
      const parsed = parseCsvText(report.csv);
      expect(parsed.rows).toHaveLength(report.rowCount);
      expect(parsed.rows.every(row => typeof row.column_0 === 'string')).toBe(true);
      if (kind === 'removed') expect(parsed.rows[0].column_0).toBe('00000001');
      if (kind === 'changed') expect(parsed.rows.some(row => row.column_0 === '123456789012345678901234567890')).toBe(true);
    }
    expect(original.rows[3].column_1).toBe('Fictional notebook, lined');
  });
  it.each(['free', 'pro'] as const)('uses the existing %s size and row limits', plan => {
    for (const tool of ['crm-csv-cleaner', 'csv-compare'] as const) {
      expect(rowViolation(plan, tool, 20)).toBeNull();
      expect(rowViolation(plan, tool, plan === 'free' ? 501 : 50001)).not.toBeNull();
      expect(fileSizeViolation(plan, tool, createCrmSampleFile().size, 'sample.csv')).toBeNull();
      expect(fileSizeViolation(plan, tool, (plan === 'free' ? 10 : 25) * 1024 * 1024 + 1, 'large.csv')).not.toBeNull();
    }
  });
});

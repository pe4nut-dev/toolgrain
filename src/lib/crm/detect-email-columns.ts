import { normalizeHeader } from '../csv/detect-columns';
import type { CsvColumn } from '../csv/types';
// Explicit aliases avoid treating email status/count/consent fields as addresses.
const aliases = new Set(['email', 'mail', 'emailaddress', 'emailadresse', 'emailavis', 'billingemail', 'contactemail']);
export function detectEmailColumns(columns: readonly CsvColumn[]): CsvColumn[] {
  return columns.filter(column => aliases.has(normalizeHeader(column.name)));
}

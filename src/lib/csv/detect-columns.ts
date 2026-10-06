import type { CrmFieldType, CsvColumn, DetectedColumn } from './types';
const crmFields: readonly { field: CrmFieldType; label: string; aliases: readonly string[] }[] = [
  { field: 'first_name', label: 'First name', aliases: ['first_name', 'firstname', 'first name', 'given_name', 'given name'] },
  { field: 'last_name', label: 'Last name', aliases: ['last_name', 'lastname', 'last name', 'surname', 'family_name', 'family name'] },
  { field: 'full_name', label: 'Full name', aliases: ['name', 'full_name', 'full name', 'contact_name', 'contact name'] },
  { field: 'company', label: 'Company', aliases: ['company', 'company_name', 'organization', 'organisation', 'business', 'business_name'] },
  { field: 'email', label: 'Email', aliases: ['email', 'email_address', 'e-mail', 'mail'] },
  { field: 'phone', label: 'Phone', aliases: ['phone', 'phone_number', 'telephone', 'mobile', 'mobile_phone'] },
  { field: 'location', label: 'Location', aliases: ['location', 'city', 'address', 'region', 'country'] },
];
// Normalize only a matching key, never the header displayed or any cell value.
export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, '');
}
export function detectColumns(columns: readonly CsvColumn[]): DetectedColumn[] {
  return crmFields.map(({ field, label, aliases }) => {
    const normalizedAliases = new Set(aliases.map(normalizeHeader));
    return { field, label, columns: columns.filter(column => normalizedAliases.has(normalizeHeader(column.name))) };
  });
}

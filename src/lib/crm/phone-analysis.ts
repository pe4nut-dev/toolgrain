export function normalizePhone(value: string): string {
  const normalized=value.trim().replace(/[\s()\-/]/g,'');
  // Do not infer countries, strip trunk zeroes or equate 00 with +.
  return /^\+?\d{7,15}$/.test(normalized)?normalized:'';
}
export function phoneStyle(value: string): string {
  return [/[()]/.test(value)?'parentheses':'',/-/.test(value)?'hyphens':'',/\//.test(value)?'slashes':'',/\s/.test(value.trim())?'spaces':''].filter(Boolean).join('+')||'compact';
}

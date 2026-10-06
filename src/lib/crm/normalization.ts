export function normalizeForComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
// Comparison only: compose decomposed umlauts before German spelling replacements.
export function normalizeGermanTextForComparison(value: string): string {
  return value.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}
export function normalizeIdentity(value: string): string {
  return normalizeGermanTextForComparison(value)
    .normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]/gu,'');
}
export function normalizeCompany(value: string): string {
  const comparable = normalizeForComparison(value).replace(/[.,]/g,'');
  return normalizeIdentity(comparable.replace(/(?:\s+(?:gmbh|ag|inc|ltd|llc|limited|corp|corporation))+$/i,''));
}
export function suggestedNameCase(value: string): string | null {
  const trimmed=value.trim();
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(trimmed)) return null;
  if (/^(van|von|de|del|da|di|du|al|bin|ibn|der|den|la|le|dos)$/i.test(trimmed) || /^(mc|mac)/i.test(trimmed)) return null;
  const lower=trimmed.toLowerCase();
  const upper=trimmed.toUpperCase();
  if (lower===upper || (trimmed!==lower && trimmed!==upper)) return null;
  const suggested=value.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+/g,part=>part[0].toUpperCase()+part.slice(1).toLowerCase());
  return suggested===value?null:suggested;
}

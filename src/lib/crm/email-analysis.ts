export function emailProblem(value: string): string | null {
  const atCount=(value.match(/@/g)??[]).length;
  if (atCount>1) return 'Email contains more than one @ character.';
  if (atCount!==1) return 'Email must contain exactly one @ character.';
  if (/\s/.test(value)) return 'Email contains whitespace.';
  const [local,domain]=value.split('@');
  if (!local || !domain) return 'Email needs text before and after @.';
  if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return 'Email contains an invalid local part.';
  const labels=domain.split('.');
  if (labels.length<2 || !labels.every(label=>/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label))) return 'Email domain needs valid labels and a dot.';
  if (!/^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{2,59})$/.test(labels.at(-1)??'')) return 'Email domain needs a recognizable top-level suffix.';
  if (value.length>254 || local.length>64 || labels.some(label=>label.length>63)) return 'Email is longer than practical address limits.';
  return null;
}
export function normalizeEmail(value: string): string { return value.trim().toLowerCase(); }

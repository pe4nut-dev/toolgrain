import { ShieldCheck } from 'lucide-react';
import type { Tool } from '@/lib/tools';
export function PrivacyBadge({ privacy }: { privacy: Tool['privacy'] }) {
  if (privacy?.mode !== 'local') return null;
  return <span className="local-privacy-badge"><ShieldCheck size={13} aria-hidden="true" />Runs locally</span>;
}

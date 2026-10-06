import type { Tool } from '@/lib/tools';
const statusLabels: Record<Tool['status'], string> = {
  'coming-soon': 'Coming soon',
  available: 'Available',
  beta: 'Beta',
  new: 'New',
};
export function StatusBadge({ status }: { status: Tool['status'] }) {
  return <span className={'status ' + status}><span aria-hidden="true" />{statusLabels[status]}</span>;
}

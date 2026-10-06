import type { ComponentType } from 'react';
import { Wrench } from 'lucide-react';
import type { Tool } from '@/lib/tools';
import { CSVCompare } from './apps/csv-compare';
import { CRMCSVCleaner } from './apps/crm-csv-cleaner';
// Server-side mapping keeps client component references out of tool metadata.
// Availability is controlled centrally by the tool registry.
const toolComponents: Partial<Record<string, ComponentType>> = {
  'crm-csv-cleaner': CRMCSVCleaner,
  'csv-compare': CSVCompare,
};
export function ToolWorkspace({ tool }: { tool: Tool }) {
  const Component = toolComponents[tool.slug];
  return <section className="workspace" aria-label={tool.name + ' workspace'}>
    {Component ? <Component /> : <div className="workspace-placeholder">
      <span className="tool-icon"><Wrench size={26} aria-hidden="true" /></span>
      <span className="eyebrow">COMING SOON</span><h2>{tool.name} is on the way.</h2>
      <p className="muted">This tool is not available yet. Explore the CRM CSV Cleaner for local contact-file cleanup.</p>
    </div>}
  </section>;
}

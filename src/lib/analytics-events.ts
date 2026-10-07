export type ToolgrainEvent = 'tool_started' | 'tool_completed' | 'export_clicked' | 'upgrade_clicked' | 'checkout_started';
export type AnalyticsTool = 'crm-cleaner' | 'csv-compare' | 'supplier-shopify';
export type EventProperties = { tool?: AnalyticsTool; plan?: 'free' | 'pro' };

// This self-contained validator is also serialized into the pre-load privacy guard.
export function sanitizeToolgrainEvent(event: unknown, data: unknown): { name: ToolgrainEvent; data: EventProperties } | null {
  if (typeof event !== 'string' || !['tool_started','tool_completed','export_clicked','upgrade_clicked','checkout_started'].includes(event)) return null;
  if (data !== undefined && (!data || typeof data !== 'object' || Array.isArray(data))) return null;
  const value = (data ?? {}) as EventProperties;
  const result: EventProperties = {};
  if (value.tool !== undefined) {
    if (!['crm-cleaner','csv-compare','supplier-shopify'].includes(value.tool)) return null;
    result.tool = value.tool;
  }
  if (value.plan !== undefined) {
    if (value.plan !== 'free' && value.plan !== 'pro') return null;
    result.plan = value.plan;
  }
  return { name: event as ToolgrainEvent, data: result };
}

export function trackToolgrainEvent(event: ToolgrainEvent, data?: EventProperties): void {
  try {
    if (typeof window === 'undefined') return;
    const safe = sanitizeToolgrainEvent(event, data);
    if (!safe) return;
    const tracker = (window as Window & { umami?: { track: (name: ToolgrainEvent, data: EventProperties) => unknown } }).umami;
    if (!tracker || typeof tracker.track !== 'function') return;
    // Do not await analytics or delay the user's action. Swallow rejected promises too.
    const pending = tracker.track(safe.name, safe.data);
    void Promise.resolve(pending).catch(() => {});
  } catch { /* Analytics is never critical to a workflow. */ }
}

export const analyticsToolIds = {
  'crm-csv-cleaner': 'crm-cleaner',
  'csv-compare': 'csv-compare',
  'supplier-csv-to-shopify': 'supplier-shopify',
} as const;

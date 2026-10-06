import type { ReactNode } from 'react';
export type WorkspaceState = 'idle' | 'file-selected' | 'processing' | 'result' | 'error';
type WorkspaceShellProps = {
  state: WorkspaceState;
  upload: ReactNode;
  settings?: ReactNode;
  action?: ReactNode;
  result?: ReactNode;
  error?: ReactNode;
  note?: ReactNode;
};
// The tool owns state and logic. This component supplies the shared visual frame.
export function WorkspaceShell({ state, upload, settings, action, result, error, note }: WorkspaceShellProps) {
  return <div className="workspace-shell" data-state={state} aria-busy={state === 'processing'}>
    <div className="workspace-upload">{upload}</div>
    {settings && <div className="workspace-settings">{settings}</div>}
    {error && state === 'error' && <div className="workspace-error" role="alert">{error}</div>}
    {state === 'processing' && <p role="status" className="workspace-progress">Processing your file…</p>}
    {action && <div className="workspace-action">{action}</div>}
    {state === 'result' && result && <div className="workspace-result">{result}</div>}
    {note && <div className="workspace-note">{note}</div>}
  </div>;
}

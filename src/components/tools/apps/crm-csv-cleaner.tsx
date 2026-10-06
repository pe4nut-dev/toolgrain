'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { parseCsvFile, CsvError } from '@/lib/csv/parse-csv';
import { detectColumns } from '@/lib/csv/detect-columns';
import { analyzeCrm } from '@/lib/crm/analyze-crm';
import type { CrmAnalysis } from '@/lib/crm/types';
import { createCleaningSession } from '@/lib/crm/clean/apply-fixes';
import type { CleaningSession } from '@/lib/crm/clean/types';
import { CrmCleaningWorkflow } from '../crm-cleaning-workflow';
import { CrmHealthReport } from '../crm-health-report';
import type { ParsedCsv } from '@/lib/csv/types';
import { FileDropzone } from '../file-dropzone';
import { SelectedFiles } from '../selected-files';
import { WorkspaceShell, type WorkspaceState } from '../workspace-shell';
import { CsvAnalysisResult } from '../csv-analysis-result';
const acceptedTypes = ['.csv'] as const;
const maxFileSize = 10 * 1024 * 1024;

export function CRMCSVCleaner() {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<WorkspaceState>('idle');
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [session, setSession] = useState<CleaningSession | null>(null);
  const [crm, setCrm] = useState<CrmAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  function clearAnalysis() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setCsv(null);
    setCrm(null);
    setSession(null);
    setError(null);
    setSelectionError(null);
  }
  function removeFile() {
    clearAnalysis();
    setFiles([]);
    setState('idle');
    setResetKey(key => key + 1);
  }
  function selectFiles(selected: File[]) {
    clearAnalysis();
    setFiles(selected);
    setState('file-selected');
  }
  async function analyze() {
    const file = files[0];
    if (!file || state === 'processing') return;
    clearAnalysis();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState('processing');
    try {
      const parsed = await parseCsvFile(file, controller.signal);
      if (controller.signal.aborted) return;
      const health = analyzeCrm(parsed, detectColumns(parsed.columns));
      if (controller.signal.aborted) return;
      setCsv(parsed);
      setCrm(health);
      setSession(createCleaningSession(parsed,health));
      setState('result');
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof CsvError ? caught.message : 'Something went wrong while reading this CSV.');
      setState('error');
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }
  // Move keyboard focus to the completed result without scrolling the page.
  useEffect(() => { if (state === 'result') resultRef.current?.focus({ preventScroll: true }); }, [state]);
  return <WorkspaceShell state={state}
    upload={<>
      {files.length > 0 && <SelectedFiles files={files} onRemove={removeFile} />}
      <FileDropzone key={resetKey} focusOnMount={resetKey > 0} acceptedTypes={acceptedTypes} multiple={false} maxFileSize={maxFileSize}
        title={files.length ? 'Drop another CSV to replace your file' : 'Drop your CSV here'} fileTypeLabel="CSV"
        fileTypeError="This tool currently supports CSV files only." validationError={selectionError}
        onValidationChange={validationError => { if (validationError) { clearAnalysis(); setSelectionError(validationError); setState('error'); } }}
        onFilesSelected={selectFiles} />
      <p className="selection-status" role="status">{!files.length ? 'Choose a CSV to analyze its structure.' : state === 'processing' ? 'Analyzing your CSV locally…' : state === 'result' ? 'Analysis complete. Your original file has not been changed.' : 'File selected. Ready to analyze.'}</p>
    </>}
    action={<><button type="button" className="button" disabled={!files.length || state === 'processing'} onClick={analyze} aria-describedby="crm-analysis-note">{state === 'processing' ? 'Analyzing…' : 'Analyze CSV'}</button><p id="crm-analysis-note">Review data health, apply safe fixes and choose which duplicate rows to keep.</p></>}
    error={error && <p className="file-error"><AlertCircle size={17} aria-hidden="true" />{error}</p>}
    result={csv && files[0] && <div ref={resultRef} tabIndex={-1} className="analysis-focus" aria-label="Analysis complete"><CsvAnalysisResult csv={csv} detected={detectColumns(csv.columns)} fileName={files[0].name} healthReport={crm && <><CrmHealthReport analysis={crm} csv={csv} />{session && <CrmCleaningWorkflow session={session} onChange={setSession} fileName={files[0].name}/>}</>} showPreview={false} /></div>}
    note={<p><ShieldCheck size={15} aria-hidden="true" />Your file stays on your device. Analysis runs in browser memory. No data is uploaded or stored by this app.</p>} />;
}

'use client';
import {createCrmSampleFile} from '@/lib/csv/sample-data';
import {WorkflowStepper} from '../workflow-stepper';
import {trackToolgrainEvent} from '@/lib/analytics-events';
import {useAccount} from '@/components/auth/account-provider';
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
import {plans} from '@/config/plans';
import {rowViolation,fileSizeViolation,fileSizeLimitMessage,type UsageViolation} from '@/lib/entitlements';
import {PlanIndicator,UpgradePrompt} from '../upgrade-prompt';
const acceptedTypes = ['.csv'] as const;


export function CRMCSVCleaner() {
  const plan=useAccount().plan,maxFileSize=plans[plan].fileSizeBytes;
  const [sampleLoaded,setSampleLoaded]=useState(false);
  const [usage,setUsage]=useState<UsageViolation|null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'automatic' | 'specific'>('automatic');
  const [duplicateKeys, setDuplicateKeys] = useState<string[]>([]);
  const [analysisVersion, setAnalysisVersion] = useState(0);
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
    setUsage(null);
    setCsv(null);
    setCrm(null);
    setSession(null);
    setError(null);
    setSelectionError(null);
  }
  function resetDuplicateConfig() { setDuplicateMode('automatic'); setDuplicateKeys([]); }
  function updateDuplicates(mode: 'automatic' | 'specific', keys: string[]) {
    setDuplicateMode(mode); setDuplicateKeys(keys);
    if (!csv || rowViolation(plan,'crm-csv-cleaner',csv.rows.length)) return;
    const health = analyzeCrm(csv, detectColumns(csv.columns), { mode, selectedColumns: keys });
    setCrm(health); setSession(createCleaningSession(csv, health)); setAnalysisVersion(version => version + 1);
  }
  function removeFile() {
    setSampleLoaded(false);
    resetDuplicateConfig();
    clearAnalysis();
    setFiles([]);
    setState('idle');
    setResetKey(key => key + 1);
  }
  function selectFiles(selected: File[], sample = false) {
    setSampleLoaded(sample);
    resetDuplicateConfig();
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
    trackToolgrainEvent('tool_started',{tool:'crm-cleaner',plan});
    try {
      const parsed = await parseCsvFile(file, controller.signal);
      if (controller.signal.aborted) return;
      const blocked=rowViolation(plan,'crm-csv-cleaner',parsed.rows.length,file.name);
      if(blocked){setUsage(blocked);setState('file-selected');return;}
      const health = analyzeCrm(parsed, detectColumns(parsed.columns), { mode: duplicateMode, selectedColumns: duplicateKeys });
      if (controller.signal.aborted) return;
      setAnalysisVersion(version => version + 1);
      setCsv(parsed);
      setCrm(health);
      setSession(createCleaningSession(parsed,health));
      setState('result');
      trackToolgrainEvent('tool_completed',{tool:'crm-cleaner',plan});
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
  const appliedFixIds=new Set(session?.appliedFixes.map(fix=>fix.issueId));
  return <div className="csv-tool-workspace crm-workspace"><WorkflowStepper steps={['Upload','Analyze','Review','Export']} current={!files.length?'Upload':!session?'Analyze':session.safeFixes.some(fix=>!appliedFixIds.has(fix.issueId))||crm!.duplicateGroups.some(group=>!session.duplicateDecisions[group.id])?'Review':'Export'}/><WorkspaceShell state={state}
    upload={<><PlanIndicator tool="crm-csv-cleaner"/>

      <FileDropzone key={resetKey} focusOnMount={resetKey > 0} acceptedTypes={acceptedTypes} multiple={false} maxFileSize={maxFileSize} fileSizeError={file=>fileSizeLimitMessage(plan,file.size)} onFileSizeRejected={file=>setUsage(fileSizeViolation(plan,'crm-csv-cleaner',file.size,file.name))}
        compactContent={files.length>0&&<SelectedFiles files={files} onRemove={removeFile} showRemove={false} metadata={<>{csv?csv.rows.length+' contacts':''}{sampleLoaded&&<>{csv?' · ':''}<span className="sample-data-badge">Fictional sample data</span></>}</>}/>} compactActions={<button type="button" className="button ghost" onClick={removeFile}>Remove</button>}
        title={files.length ? 'Drop another CSV to replace your file' : 'Drop your CSV here'} fileTypeLabel="CSV"
        fileTypeError="This tool currently supports CSV files only." validationError={selectionError}
        onValidationChange={validationError => { if (validationError) { clearAnalysis(); setSelectionError(validationError); setState('error'); } }}
        onFilesSelected={selected=>selectFiles(selected)} />
      {!sampleLoaded&&<div className="tool-sample-action"><button type="button" className="button secondary" disabled={state==='processing'} onClick={()=>selectFiles([createCrmSampleFile()],true)}>Try with sample CSV</button><p>Explore 20 fictional contacts with duplicates and data issues.</p></div>}
      {usage&&<UpgradePrompt usage={usage}/>}
      <p className="selection-status" role="status">{!files.length ? 'Choose a CSV to analyze its structure.' : state === 'processing' ? 'Analyzing your CSV locally…' : state === 'result' ? 'Analysis complete. Your original file has not been changed.' : 'File selected. Ready to analyze.'}</p>
    </>}
    action={<><button type="button" className="button" disabled={!files.length || !!usage || state === 'processing'} onClick={analyze} aria-describedby="crm-analysis-note">{state === 'processing' ? 'Analyzing…' : 'Analyze CSV'}</button><p id="crm-analysis-note">Review data health, apply safe fixes and choose which duplicate rows to keep.</p></>}
    error={error && <p className="file-error"><AlertCircle size={17} aria-hidden="true" />{error}</p>}
    result={csv && files[0] && <div ref={resultRef} tabIndex={-1} className="analysis-focus" aria-label="Analysis complete"><section className="duplicate-config" aria-labelledby="duplicate-config-title"><h3 id="duplicate-config-title">Duplicate detection</h3><p className="muted">{duplicateMode==='automatic'?'Uses email, phone and CRM identity signals.':'Choose the columns that identify the same record. Rows with the same selected values will be grouped for review, even when other fields differ.'}</p><div className="duplicate-config-controls"><label htmlFor="duplicate-mode">Detection mode<select id="duplicate-mode" aria-label="Detection mode" value={duplicateMode} onChange={event=>updateDuplicates(event.target.value as 'automatic' | 'specific', duplicateKeys)}><option value="automatic">Automatic</option><option value="specific">Specific columns</option></select></label></div>{duplicateMode==='specific' && <><fieldset className="duplicate-key-columns"><legend>Duplicate key columns</legend>{csv.columns.map((column,index)=><label key={column.key}><input type="checkbox" checked={duplicateKeys.includes(column.key)} onChange={event=>updateDuplicates(duplicateMode,event.target.checked?[...duplicateKeys,column.key]:duplicateKeys.filter(key=>key!==column.key))}/>{column.name}{csv.columns.filter(item=>item.name===column.name).length>1?' (column '+(index+1)+')':''}</label>)}</fieldset><p className="muted">Choose at least one column. Text comparison ignores case, repeated whitespace and equivalent German umlaut spellings such as München / Muenchen and Müller / Mueller. Punctuation and leading zeros remain significant. Rows with an empty value in any selected column are excluded from this matching mode. Original values remain unchanged.</p></>}<p className="muted">No rows are removed automatically.</p><p className="muted">Changing duplicate settings starts a fresh review and resets applied fixes and row decisions. All rows are kept until you choose otherwise.</p></section><CsvAnalysisResult key={analysisVersion} csv={csv} detected={detectColumns(csv.columns)} fileName={files[0].name} healthReport={crm && <><CrmHealthReport analysis={crm} csv={csv} />{session && <CrmCleaningWorkflow session={session} onChange={setSession} fileName={files[0].name}/>}</>} showPreview={false} /></div>}
    note={<p><ShieldCheck size={15} aria-hidden="true" />Your file stays on your device. Analysis runs in browser memory. No data is uploaded or stored by this app.</p>} /></div>;
}

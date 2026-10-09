'use client';
import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { formatFileSize, validateFiles, type FileSelectionRules } from '@/lib/files';

type FileDropzoneProps = FileSelectionRules & {
  onFileSizeRejected?: (file: File) => void;
  fileSizeError?: (file: File) => string;
  disabled?: boolean;
  focusOnMount?: boolean;
  validationError?: string | null;
  onFilesSelected: (files: File[]) => void;
  onValidationChange?: (error: string | null) => void;
  title?: string;
  fileTypeLabel?: string;
  compactContent?: ReactNode;
  compactActions?: ReactNode;
};
export function FileDropzone({ acceptedTypes, multiple = false, maxFileSize, fileTypeError, onFileSizeRejected, fileSizeError, disabled = false, focusOnMount = false, validationError, onFilesSelected, onValidationChange, compactContent, compactActions, title = 'Drop your files here', fileTypeLabel = acceptedTypes.join(', ') || 'Any file type' }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = validationError === undefined ? localError : validationError;
  const id = useId();
  const helpId = id + '-help';
  const errorId = id + '-error';

  function selectFiles(files: File[]) {
    if (disabled || files.length === 0) return;
    const oversized = !validateFiles(files, { acceptedTypes, multiple, maxFileSize: Infinity, fileTypeError }) ? files.find(file=>file.size>maxFileSize) : undefined;
    const validationError = oversized && fileSizeError ? fileSizeError(oversized) : validateFiles(files, { acceptedTypes, multiple, maxFileSize, fileTypeError });
    setLocalError(validationError);
    onValidationChange?.(validationError);
    if (oversized) onFileSizeRejected?.(oversized);
    if (!validationError) onFilesSelected(files);
  }
  function isFileDrag(event: DragEvent) { return Array.from(event.dataTransfer.types).includes('Files'); }
  function onDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled || !isFileDrag(event)) return;
    dragDepth.current += 1;
    setDragOver(true);
  }
  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    selectFiles(Array.from(event.dataTransfer.files));
  }
  return <div className="file-upload">
    <div className={'file-dropzone' + (compactContent ? ' file-dropzone-compact' : '') + (dragOver && !disabled ? ' is-dragging' : '') + (disabled ? ' is-disabled' : '')}
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDrop={onDrop}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; }}>
      {compactContent || <><span className="upload-icon"><Upload size={24} aria-hidden="true" /></span>
      <h2 className="dropzone-title">{dragOver && !disabled ? 'Drop to select your file' : title}</h2>
      <span className="dropzone-or">or</span></>}
      <div className="file-upload-actions"><button type="button" className="button secondary" autoFocus={focusOnMount} disabled={disabled} aria-describedby={helpId + (error ? ' ' + errorId : '')} onClick={() => inputRef.current?.click()}>{compactContent ? 'Replace file' : 'Choose '+(multiple ? 'files' : 'file')}</button>{compactContent&&compactActions}</div>
      <input ref={inputRef} type="file" hidden aria-label={multiple ? 'Choose files' : 'Choose file'} accept={acceptedTypes.join(',')} multiple={multiple} disabled={disabled}
        onChange={event => { selectFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ''; }} />
      <p id={helpId} className={compactContent?'sr-only':'dropzone-help'}>{fileTypeLabel} · Max {formatFileSize(maxFileSize)}{multiple ? ' per file' : ''}</p>
    </div>
    {error && <p id={errorId} role="alert" className="file-error"><AlertCircle size={17} aria-hidden="true" />{error}</p>}
  </div>;
}

import React from 'react';
import { FileText, X } from 'lucide-react';
import { formatFileSize } from '../../lib/files';
export function SelectedFiles({ files, onRemove, disabled = false }: { files: readonly File[]; onRemove: (index: number) => void; disabled?: boolean }) {
  return <ul className="selected-files" aria-label="Selected files">{files.map((file, index) => {
    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() : undefined;
    return <li className="selected-file" key={file.name + '-' + index}>
      <span className="tool-icon"><FileText size={22} aria-hidden="true" /></span>
      <div className="selected-file-info"><strong title={file.name}>{file.name}</strong><span>{extension || file.type || 'File'} · {formatFileSize(file.size)}</span></div>
      <button type="button" className="remove-file" disabled={disabled} aria-label={'Remove ' + file.name} onClick={() => onRemove(index)}><X size={15} aria-hidden="true" /><span>Remove</span></button>
    </li>;
  })}</ul>;
}

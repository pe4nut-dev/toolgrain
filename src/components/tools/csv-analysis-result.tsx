import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import type { DetectedColumn, ParsedCsv } from '@/lib/csv/types';
const previewLimit = 20;
const number = new Intl.NumberFormat('en');
export function CsvAnalysisResult({ csv, detected, fileName, healthReport, showPreview = true }: { csv: ParsedCsv; detected: DetectedColumn[]; fileName: string; healthReport?: ReactNode; showPreview?: boolean }) {
  const preview = csv.rows.slice(0, previewLimit);
  const detectedCount = detected.filter(item => item.columns.length > 0).length;
  const delimiterLabel = csv.delimiter === ';' ? 'Semicolon-separated' : csv.delimiter === '\t' ? 'Tab-separated' : 'Comma-separated';
  return <section className="csv-analysis" aria-label="CSV analysis result">
    <div className="analysis-heading"><CheckCircle2 size={20} aria-hidden="true" /><div><h2>CSV analyzed</h2><p>{fileName}</p></div></div>
    <p role="status" className="sr-only">CSV analyzed. {number.format(csv.rows.length)} rows, {number.format(csv.columns.length)} columns, {detectedCount} detected fields.</p>
    <dl className="csv-summary">
      <div><dt>Rows</dt><dd>{number.format(csv.rows.length)}</dd></div>
      <div><dt>Columns</dt><dd>{number.format(csv.columns.length)}</dd></div>
      <div><dt>Detected fields</dt><dd>{detectedCount}</dd></div>
      <div><dt>Delimiter</dt><dd className="delimiter-value">{delimiterLabel}</dd></div>
    </dl>
    {csv.warnings.map(warning => <p role="status" className="csv-warning" key={warning}><AlertCircle size={16} aria-hidden="true" />{warning} Each column is kept separately.</p>)}
    {healthReport}
    <section className="csv-columns"><h3>Columns in your file</h3><ul>{csv.columns.map(column => <li key={column.key}>{column.name}</li>)}</ul></section>
    <section className="detected-fields"><h3>Detected fields</h3><p className="muted">Matched by original header name. Unrecognized fields are normal.</p><dl>{detected.map(item => <div key={item.field}><dt>{item.label}</dt><ArrowRight size={13} aria-hidden="true" /><dd>{item.columns.length ? item.columns.map(column => <span key={column.key}>{column.name}</span>) : <span className="not-detected">Not detected</span>}</dd></div>)}</dl></section>
    {showPreview && <section className="csv-preview"><h3 id="csv-preview-heading">Data preview</h3>
      <div className="csv-table-scroll" tabIndex={0} role="region" aria-labelledby="csv-preview-heading">
        <table><caption className="sr-only">First {preview.length} rows of your CSV. Blank cells show an em dash.</caption><thead><tr><th scope="col">Data row</th>{csv.columns.map(column => <th scope="col" key={column.key}>{column.name}</th>)}</tr></thead>
          <tbody>{preview.map((row, index) => <tr key={index}><th scope="row">{index+1}</th>{csv.columns.map(column => <td key={column.key}>{row[column.key] === '' ? <span className="empty-cell" aria-label="Empty value">—</span> : row[column.key]}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="preview-count">Showing {number.format(preview.length)} of {number.format(csv.rows.length)} rows</p>
    </section>}
  </section>;
}

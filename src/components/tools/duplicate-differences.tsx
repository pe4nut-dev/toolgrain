'use client';
import { useState } from 'react';
import type { DuplicateGroup } from '@/lib/crm/types';
export function DuplicateDifferences({group}:{group:DuplicateGroup}) {
  const [limit,setLimit]=useState(20);
  if(!group.selectedKey)return null;
  return <section aria-label="Selected key and differing fields"><h5>Matched on</h5><p>{group.selectedKey.map(part=>part.columnName).join(' + ')}</p><h5>Differing non-key fields (original values)</h5>{!group.differences?.length?<p>No differing non-key fields.</p>:<div className="csv-table-scroll" role="region" tabIndex={0} aria-label="Differing original values"><table><thead><tr><th scope="col">Data row</th>{group.differences.map(field=><th scope="col" key={field.columnKey}>{field.columnName}</th>)}</tr></thead><tbody>{group.rows.slice(0,limit).map((row,index)=><tr key={row}><th scope="row">{row}</th>{group.differences!.map(field=><td key={field.columnKey}><code style={{whiteSpace:'pre-wrap'}}>{field.values[index].value || 'Empty'}</code></td>)}</tr>)}</tbody></table></div>}{group.differences?.length && group.rows.length>limit?<button className="report-more" type="button" onClick={()=>setLimit(value=>value+20)}>Show 20 more differing records</button>:null}</section>;
}

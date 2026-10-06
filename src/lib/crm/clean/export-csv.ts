import Papa from 'papaparse';
import type { CleaningSession } from './types';
export function exportCleanedCsv(session:CleaningSession):string{
 return '\uFEFF'+Papa.unparse({fields:session.originalCsv.columns.map(column=>column.name),data:session.workingRows.map(row=>session.originalCsv.columns.map(column=>row[column.key]??''))},{delimiter:session.originalCsv.delimiter,newline:'\r\n',skipEmptyLines:false});
}
export function cleanedFilename(name:string):string{
 const leaf=name.split(/[\\/]/).at(-1)??'';
 const stem=leaf.replace(/\.csv$/i,'').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/g,'').slice(0,180);
 return (stem||'contacts')+'-cleaned.csv';
}
export function downloadCleanedCsv(session:CleaningSession,name:string):void{
 const url=URL.createObjectURL(new Blob([exportCleanedCsv(session)],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=cleanedFilename(name);document.body.append(link);link.click();link.remove();
 // Allow the browser to consume the URL before releasing it.
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}

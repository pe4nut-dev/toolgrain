import { describe, expect, it, vi } from 'vitest';
import Papa from 'papaparse';
import { parseCsvText } from '../src/lib/csv/parse-csv';
import { compareCsv } from '../src/lib/csv-compare/compare-csv';
import { createComparisonExport, downloadComparisonExport, exportFilename, exportDelimiter, type ExportCategory } from '../src/lib/csv-compare/export-csv';
function setup(a='id,name\n1,A\n2,Removed',b='name,id\nB,1\nAdded,3') {const old=parseCsvText(a),next=parseCsvText(b),result=compareCsv(old,next,old.columns.find(c=>c.name==='id')!.key,next.columns.find(c=>c.name==='id')!.key);return {old,next,result,report:(kind:ExportCategory)=>createComparisonExport(kind,result,old,next,'customers-january.csv','customers-february.csv')};}
function roundtrip(csv:string) {const parsed=parseCsvText(csv);return {headers:parsed.columns.map(c=>c.name),rows:parsed.rows.map(row=>parsed.columns.map(c=>row[c.key])),delimiter:parsed.delimiter};}
describe('CSV Compare exports',()=>{
 it('added exports only new source rows',()=>{expect(roundtrip(setup().report('added')!.csv).rows).toEqual([['Added','3']]);});
 it('added preserves new column order without metadata',()=>{expect(roundtrip(setup().report('added')!.csv).headers).toEqual(['name','id']);});
 it('removed exports only old source rows',()=>{expect(roundtrip(setup().report('removed')!.csv).rows).toEqual([['2','Removed']]);});
 it('removed preserves old column order without metadata',()=>{expect(roundtrip(setup().report('removed')!.csv).headers).toEqual(['id','name']);});
 it('changed creates one row per changed field',()=>{const s=setup('id,name,city\n1,A,Berlin','id,name,city\n1,B,Bonn');expect(s.report('changed')!.rowCount).toBe(2);expect(roundtrip(s.report('changed')!.csv).headers).toEqual(['key','column','old_value','new_value']);});
 it('changed preserves original values and uses trimmed matching key',()=>{const s=setup('id,name\n 1 , A ','id,name\n1,B ');expect(roundtrip(s.report('changed')!.csv).rows).toEqual([['1','name',' A ','B ']]);});
 it('key issues use clear issue types',()=>{const s=setup('id,name\n1,A\n1,B','id,name\n2,C');expect(roundtrip(s.report('issues')!.csv).rows[0][0]).toBe('duplicate_key');});
 it('exports duplicate record numbers',()=>{const s=setup('id,name\n1,A','id,name\n1,B\n1,C');expect(roundtrip(s.report('issues')!.csv).rows.find(r=>r[1]==='new')?.[3]).toBe('2;3');});
 it('exports missing keys as empty with correct file',()=>{const s=setup('id,name\n,A','id,name\n1,B');expect(roundtrip(s.report('issues')!.csv).rows).toEqual([['missing_key','old','','2','Key value is empty']]);});
 it('empty categories return null instead of header-only exports',()=>{const s=setup('id,name\n1,A','id,name\n1,A');for(const kind of ['added','removed','changed','issues'] as const)expect(s.report(kind)).toBeNull();});
 it('exports leave deeply frozen source rows unchanged',()=>{const s=setup();const before=JSON.stringify([s.old,s.next,s.result]);for(const csv of [s.old,s.next]){csv.rows.forEach(Object.freeze);csv.columns.forEach(Object.freeze);Object.freeze(csv.rows);Object.freeze(csv.columns);}for(const kind of ['added','removed','changed','issues'] as const)s.report(kind);expect(JSON.stringify([s.old,s.next,s.result])).toBe(before);});
 it('comma exports roundtrip',()=>{expect(roundtrip(setup().report('added')!.csv).delimiter).toBe(',');});
 it('semicolon exports roundtrip',()=>{const s=setup('id;name\n1;A','id;name\n1;B\n2;C');expect(roundtrip(s.report('added')!.csv)).toEqual({headers:['id','name'],rows:[['2','C']],delimiter:';'});});
 it('quotes and embedded delimiters survive roundtrip',()=>{const text='A "quote", comma; semicolon';const s=setup('id,name\n1,A',Papa.unparse({fields:['id','name'],data:[['1','A'],['2',text]]}));expect(roundtrip(s.report('added')!.csv).rows[0][1]).toBe(text);});
 it('multiline cells survive roundtrip',()=>{const text='line 1\nline 2\r\nline 3';const s=setup('id,name\n1,A',Papa.unparse({fields:['id','name'],data:[['1','A'],['2',text]]}));expect(roundtrip(s.report('added')!.csv).rows[0][1]).toBe(text);});
 it('Unicode survives UTF-8 bytes and reimport',()=>{const text='ä ö ü ß é ø Ł 東京';const s=setup('id,name\n1,A','id,name\n1,A\n2,'+text);const decoded=new TextDecoder('utf-8').decode(new TextEncoder().encode(s.report('added')!.csv));expect(roundtrip(decoded).rows[0][1]).toBe(text);});
 it('includes exactly one BOM and CRLF report lines',()=>{const csv=setup().report('changed')!.csv;expect(csv.startsWith('\uFEFFkey,column,old_value,new_value\r\n')).toBe(true);expect([...csv].filter(c=>c==='\uFEFF')).toHaveLength(1);expect(roundtrip(csv).rows).toHaveLength(1);});
 it('filenames use source basename and suffix',()=>{expect(exportFilename('customers-february.csv','added')).toBe('customers-february-added.csv');expect(setup().report('removed')!.filename).toBe('customers-january-removed.csv');});
 it('filenames keep multiple dots',()=>{expect(exportFilename('customers.2026.02.CSV','changed')).toBe('customers.2026.02-changed.csv');});
 it('exports 10,000 complete rows beyond the UI preview',()=>{const s=setup('id,name\nold,A','id,name\n'+Array.from({length:10000},(_,i)=>i+',Müller').join('\n'));const start=performance.now(),report=s.report('added')!;expect(report.rowCount).toBe(10000);const parsed=roundtrip(report.csv);expect(parsed.rows).toHaveLength(10000);expect(parsed.rows.at(-1)).toEqual(['9999','Müller']);expect(performance.now()-start).toBeLessThan(5000);});
 it('keeps spaces, Unicode and filenames without extension',()=>{expect(exportFilename('Kunden März 2026','added')).toBe('Kunden März 2026-added.csv');});
 it('strips paths and unsafe filename characters only',()=>{expect(exportFilename('C:/exports/Kunden?.csv','removed')).toBe('Kunden_-removed.csv');expect(exportFilename('','issues')).toBe('comparison-issues.csv');});
 it('keeps source keys untrimmed in added and removed',()=>{const s=setup('id,name\n 1 ,A','id,name\n 2 ,B');expect(roundtrip(s.report('added')!.csv).rows[0][0]).toBe(' 2 ');expect(roundtrip(s.report('removed')!.csv).rows[0][0]).toBe(' 1 ');});
 it('uses each report’s source delimiter',()=>{const s=setup('id;name\n1;A\n2;X','name,id\nB,1\nY,3');expect(s.report('removed')!.delimiter).toBe(';');expect(s.report('added')!.delimiter).toBe(',');expect(s.report('changed')!.delimiter).toBe(',');});
 it('key issue report uses new delimiter and includes blocked counterparts',()=>{const s=setup('id,name\n1,A\n1,B','id;name\n1;C');const report=s.report('issues')!;expect(report.delimiter).toBe(';');expect(roundtrip(report.csv).rows.map(r=>[r[0],r[1]])).toEqual([['duplicate_key','old'],['ambiguous_key','new']]);});
 it('falls back to comma for unsupported delimiters and preserves tabs',()=>{expect(exportDelimiter('|')).toBe(',');expect(exportDelimiter('\t')).toBe('\t');const s=setup();s.next.delimiter='|';expect(s.report('added')!.delimiter).toBe(',');});
 it('preserves empty cells, leading zeros and repeated headers',()=>{const s=setup('id,name\n1,A','id,name,name,code\n2,, B ,001');expect(roundtrip(s.report('added')!.csv)).toMatchObject({headers:['id','name','name','code'],rows:[['2','',' B ','001']]});});
 it('changed reports roundtrip with Unicode quoted values',()=>{const text='é; "y"';const s=setup(Papa.unparse({fields:['id','name'],data:[['1','ö, "x"']]}),Papa.unparse({fields:['id','name'],data:[['1',text]]}));expect(roundtrip(s.report('changed')!.csv).rows[0][3]).toBe(text);});
});

describe('browser download delivery',()=>{it('creates the correct UTF-8 Blob and filename and releases the object URL',async()=>{
 const report=setup().report('added')!;let blob:Blob|undefined;const link={href:'',download:'',click:vi.fn(),remove:vi.fn()};
 vi.useFakeTimers();vi.stubGlobal('document',{createElement:()=>link,body:{append:vi.fn()}});
 const create=vi.spyOn(URL,'createObjectURL').mockImplementation(value=>{blob=value as Blob;return 'blob:local-csv';});
 const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
 try {downloadComparisonExport(report);expect(link.download).toBe('customers-february-added.csv');expect(link.href).toBe('blob:local-csv');expect(link.click).toHaveBeenCalledOnce();expect(link.remove).toHaveBeenCalledOnce();expect(blob!.type).toBe('text/csv;charset=utf-8');expect(await blob!.text()).toBe(report.csv.slice(1));const bytes=new Uint8Array(await blob!.arrayBuffer());expect([...bytes.slice(0,3)]).toEqual([239,187,191]);expect(roundtrip(new TextDecoder().decode(bytes)).rows).toEqual([['Added','3']]);expect(revoke).not.toHaveBeenCalled();vi.advanceTimersByTime(1000);expect(revoke).toHaveBeenCalledWith('blob:local-csv');} finally {create.mockRestore();revoke.mockRestore();vi.unstubAllGlobals();vi.useRealTimers();}
});});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCsvText } from '../src/lib/csv/parse-csv';
import { compareCsv } from '../src/lib/csv-compare/compare-csv';
function compare(a: string, b: string, oldName = 'id', newName = oldName) {
 const old = parseCsvText(a), next = parseCsvText(b);
 return compareCsv(old, next, old.columns.find(c => c.name === oldName)!.key, next.columns.find(c => c.name === newName)!.key);
}
describe('CSV comparison', () => {
 it('finds added rows using new values', () => { const r = compare('id,name\n1,A', 'id,name\n1,A\n2,B'); expect(r.added.map(x=>x.key)).toEqual(['2']); expect(r.added[0].row.column_1).toBe('B'); });
 it('finds removed rows using old values', () => { const r = compare('id,name\n1,A\n2,B', 'id,name\n1,A'); expect(r.removed.map(x=>x.key)).toEqual(['2']); expect(r.removed[0].row.column_1).toBe('B'); });
 it('finds changed rows', () => { expect(compare('id,name\n1,A', 'id,name\n1,B').changed[0].changes).toEqual([{column:'name',oldValue:'A',newValue:'B'}]); });
 it('finds unchanged rows', () => { expect(compare('id,name\n1,A', 'id,name\n1,A').unchanged).toHaveLength(1); });
 it('ignores column order for unchanged rows', () => { expect(compare('id,name,email\n1,A,a@b.de','email,id,name\na@b.de,1,A').unchanged).toHaveLength(1); });
 it('detects changed fields despite reordered columns', () => { expect(compare('id,name,email\n1,A,a@b.de','email,id,name\na@b.de,1,B').changed[0].changes[0].column).toBe('name'); });
 it('separates columns only in old', () => { const r=compare('id,name,legacy\n1,A,x','id,name\n1,A'); expect(r.schema.onlyOld).toEqual(['legacy']); expect(r.unchanged).toHaveLength(1); });
 it('separates columns only in new', () => { const r=compare('id,name\n1,A','id,name,segment\n1,A,x'); expect(r.schema.onlyNew).toEqual(['segment']); expect(r.changed).toHaveLength(0); });
 it('allows different key headers', () => { expect(compare('customer_id,name\n1,A','id,name\n1,A','customer_id','id').unchanged).toHaveLength(1); });
 it('trims only matching keys', () => { expect(compare('id,name\n 123 ,A','id,name\n123,A').unchanged[0].key).toBe('123'); });
 it('keeps key case significant', () => { const r=compare('id,name\nABC,A','id,name\nabc,A'); expect(r.added).toHaveLength(1); expect(r.removed).toHaveLength(1); });
 it('reports missing keys', () => { const r=compare('id,name\n ,A','id,name\n1,A'); expect(r.issues[0].reason).toBe('missing'); expect(r.issues[0].oldRows[0].rowNumber).toBe(2); });
 it('reports old duplicates after trimming', () => { const r=compare('id,name\n1,A\n 1 ,B','id,name\n1,A'); expect(r.issues[0].duplicateIn).toBe('old'); expect(r.issues[0].oldRows).toHaveLength(2); });
 it('reports new duplicates', () => { const r=compare('id,name\n1,A','id,name\n1,A\n1,B'); expect(r.issues[0].duplicateIn).toBe('new'); });
 it('excludes ambiguous keys and their unique counterparts', () => { const r=compare('id,name\n1,A\n1,B\n2,C','id,name\n1,D\n2,C'); expect([r.added.length,r.removed.length,r.changed.length,r.unchanged.length]).toEqual([0,0,0,1]); expect(r.issues[0].newRows).toHaveLength(1); });
 it('reports multiple changes, preserving data whitespace and case', () => { expect(compare('id,name,city\n1,Example GmbH,Berlin','id,name,city\n1,Example GmbH ,berlin').changed[0].changes).toEqual([{column:'name',oldValue:'Example GmbH',newValue:'Example GmbH '},{column:'city',oldValue:'Berlin',newValue:'berlin'}]); });
 it('does not mutate original rows or columns', () => { const a=parseCsvText('id,name\n 1 ,A'), b=parseCsvText('id,name\n1,B'); const before=JSON.stringify([a,b]); for(const csv of [a,b]){csv.rows.forEach(Object.freeze);csv.columns.forEach(Object.freeze);Object.freeze(csv.rows);Object.freeze(csv.columns);} compareCsv(a,b,'column_0','column_0'); expect(JSON.stringify([a,b])).toBe(before); });
 it('compares Unicode accurately', () => { expect(compare('id,name\n1,Müller 東京','id,name\n1,Müller 大阪').changed[0].changes[0].newValue).toBe('Müller 大阪'); });
 it('supports different delimiters, quoted values and line endings', () => { expect(compare('id;name\r\n1;"A; B"','name,id\n"A; B",1').unchanged).toHaveLength(1); });
 it('compares 10,000 rows per file with correct totals', () => { const a='id,value\n'+Array.from({length:10000},(_,i)=>i+',old').join('\n');const b='value,id\n'+Array.from({length:10000},(_,i)=>(i%2?'old':'new')+','+(i+100)).join('\n'); const start=performance.now();const r=compare(a,b);expect([r.added.length,r.removed.length,r.changed.length,r.unchanged.length]).toEqual([100,100,4950,4950]);expect(performance.now()-start).toBeLessThan(5000); });
 it('reports duplicates in both files once per ambiguous key',()=>{const r=compare('id,name\n1,A\n1,B','id,name\n1,C\n1,D');expect(r.issues[0].duplicateIn).toBe('both');expect(r.issues).toHaveLength(1);});
 it('does not compare selected keys as data fields',()=>{expect(compare('id,name\n1,A','id,name\n 1 ,A').changed).toHaveLength(0);});
 it('reports ambiguous duplicate headers separately and excludes them from field matching',()=>{const r=compare('id,name,name\n1,A,B','id,name\n1,C');expect(r.schema.ambiguous).toEqual(['name']);expect(r.unchanged).toHaveLength(1);});
 it('handles files with no shared non-key columns',()=>{const r=compare('id,old_value\n1,A','new_id,new_value\n1,B','id','new_id');expect(r.unchanged).toHaveLength(1);});
 it('rejects nonexistent selected key columns',()=>{const csv=parseCsvText('id,name\n1,A');expect(()=>compareCsv(csv,csv,'bad','column_0')).toThrow('Choose a valid key');});
});

describe('CSV Compare regression fixtures',()=>{it('matches browser fixture totals and original changed values',()=>{const r=compare(readFileSync(new URL('./fixtures/compare-old.csv',import.meta.url),'utf8'),readFileSync(new URL('./fixtures/compare-new.csv',import.meta.url),'utf8'),'old_id','id');expect([r.added.length,r.removed.length,r.changed.length,r.unchanged.length,r.issues.length]).toEqual([1,1,1,1,3]);expect(r.changed[0].changes).toEqual([{column:'name',oldValue:'Example Ltd',newValue:'Example GmbH'},{column:'city',oldValue:'Berlin',newValue:'berlin'}]);});});

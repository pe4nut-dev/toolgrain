import { describe,it,expect } from 'vitest';
import { parseCsvText } from '../src/lib/csv/parse-csv';
import { detectColumns } from '../src/lib/csv/detect-columns';
import { detectEmailColumns } from '../src/lib/crm/detect-email-columns';
import { analyzeCrm } from '../src/lib/crm/analyze-crm';
import { createCleaningSession,applySafeFixes } from '../src/lib/crm/clean/apply-fixes';
import { decideDuplicate } from '../src/lib/crm/clean/duplicate-decisions';
function run(text:string,names:string[]){const csv=parseCsvText(text);const analysis=analyzeCrm(csv,detectColumns(csv.columns),{mode:'specific',selectedColumns:names.map(name=>csv.columns.find(c=>c.name===name)!.key)});return {csv,analysis,groups:analysis.duplicateGroups};}
const source='creditor,invoice,amount,address\nRICOH,224345040,596.60,Old\nRICOH,224345040,790.00,New';
describe('CRM V0.2 specific columns',()=>{
 it('one arbitrary selected column groups rows',()=>expect(run(source,['creditor']).groups[0].rows).toEqual([1,2]));
 it('composite columns group a changed amount',()=>{const g=run(source,['creditor','invoice']).groups[0];expect(g.kind).toBe('likely');expect(g.selectedKey?.map(k=>k.value)).toEqual(['RICOH','224345040']);});
 it('same key and changed address is likely',()=>expect(run('id,address\n1,Old\n1,New',['id']).groups[0].kind).toBe('likely'));
 it('full trimmed rows remain exact',()=>{const {groups,analysis}=run('id,value\n1,A\n 1 , A ',['id']);expect(groups[0].kind).toBe('exact');expect(analysis.counts.exact_duplicate).toBe(1);});
 it('different second key components do not match',()=>expect(run('a,b,value\n1,A,X\n1,B,Y',['a','b']).groups).toEqual([]));
 it('suffixes remain significant',()=>expect(run('invoice,label\n224322318,A\n224322318-1,B',['invoice']).groups).toEqual([]));
 it('any missing component excludes even identical full rows',()=>expect(run('a,b,value\n1, ,X\n1, ,X',['a','b']).groups).toEqual([]));
 it('leaves frozen original data unchanged',()=>{const {csv}=run(source,['creditor']);const before=JSON.stringify(csv);csv.rows.forEach(Object.freeze);analyzeCrm(csv,detectColumns(csv.columns),{mode:'specific',selectedColumns:['column_0','column_1']});expect(JSON.stringify(csv)).toBe(before);});
 it('exposes differing non-key fields with original values',()=>{const g=run(source,['creditor','invoice']).groups[0];expect(g.differences).toEqual([{columnKey:'column_2',columnName:'amount',values:[{row:1,value:'596.60'},{row:2,value:'790.00'}]},{columnKey:'column_3',columnName:'address',values:[{row:1,value:'Old'},{row:2,value:'New'}]}]);});
 it('three rows form one group without pairwise expansion',()=>{const g=run('key,value\nA,1\nA,2\nA,3',['key']).groups;expect(g).toHaveLength(1);expect(g[0].rows).toEqual([1,2,3]);expect(g[0].matches).toHaveLength(2);});
 it('switching mode recomputes and fresh session resets fixes and exclusions',()=>{const {csv,analysis}=run('id,email\n1,A@example.com\n1,b@example.com',['id']);const changed=decideDuplicate(applySafeFixes(createCleaningSession(csv,analysis)),analysis.duplicateGroups[0].id,{kind:'keep_row',row:1});expect(changed.removedRows).toEqual([2]);const fresh=createCleaningSession(csv,analyzeCrm(csv,detectColumns(csv.columns),{mode:'automatic'}));expect(fresh.analysis.duplicateGroups).toEqual([]);expect(fresh.appliedFixes).toEqual([]);expect(fresh.duplicateDecisions).toEqual({});expect(fresh.workingRows).toHaveLength(2);});
 it('specific mode does not use automatic email matches',()=>expect(run('id,email\n1,a@example.com\n2,A@example.com',['id']).groups).toEqual([]));
 it('no selected columns safely produces no groups',()=>expect(run(source,[]).groups).toEqual([]));
 it('leading zeros and punctuation are significant',()=>{for(const values of [['001','1'],['A-B','AB']])expect(run('id,label\n'+values[0]+',X\n'+values[1]+',Y',['id']).groups).toEqual([]);});
 it('composite encoding cannot collide on separators',()=>expect(run('a,b,label\nA:B,C,X\nA,B:C,Y',['a','b']).groups).toEqual([]));
 it('exact subgroups survive inside a likely selected group',()=>expect(run('id,value\n1,A\n1,B\n1,B',['id']).groups[0].exactSubgroups).toEqual([[2,3]]));
 it('keeps all rows before an explicit review decision',()=>{const {csv,analysis}=run(source,['creditor','invoice']);const session=createCleaningSession(csv,analysis);expect(session.workingRows).toHaveLength(2);expect(session.removedRows).toEqual([]);});
 it('10,000 rows use bounded match counts',()=>{const text='id,value\n'+Array.from({length:10000},(_,i)=>'same,'+i).join('\n');const start=performance.now();const {groups}=run(text,['id']);expect(groups).toHaveLength(1);expect(groups[0].matches).toHaveLength(9999);expect(groups[0].differences![0].values).toHaveLength(10000);expect(performance.now()-start).toBeLessThan(5000);});
});
describe('multiple email columns',()=>{
 const aliases=['email','e-mail','email_address','e-mail-adresse','email avis','e-mail avis','E-Mail-Avis','billing_email','billing email','contact_email','contact email'];
 it.each(aliases)('recognizes %s independently',name=>expect(detectEmailColumns(parseCsvText(name+'\nx@example.com').columns)).toHaveLength(1));
 it('does not classify email metadata as addresses',()=>expect(detectEmailColumns(parseCsvText('email_count,email_status,email_opt_in\n1,active,true').columns)).toEqual([]));
 it('detects invalid E-Mail-Avis despite valid E-Mail sibling',()=>{const csv=parseCsvText('E-Mail-Avis,E-Mail\nbuchhaltung@avar,valid@example.com');const a=analyzeCrm(csv,detectColumns(csv.columns));expect(a.counts.invalid_email).toBe(1);expect(a.issues.find(i=>i.type==='invalid_email')).toMatchObject({columnName:'E-Mail-Avis',columnKey:'column_0',rows:[1],originalValues:[{row:1,value:'buchhaltung@avar'}]});});
 it('validates and suggests capitalization in every email column',()=>{const csv=parseCsvText('billing_email,contact_email,email\nBAD,Person@Example.com,other@bad');const a=analyzeCrm(csv,detectColumns(csv.columns));expect(a.counts.invalid_email).toBe(2);expect(a.issues.find(i=>i.type==='email_case')?.columnName).toBe('contact_email');const session=applySafeFixes(createCleaningSession(csv,a));expect(session.workingRows[0].column_1).toBe('person@example.com');expect(session.originalCsv.rows[0].column_1).toBe('Person@Example.com');});
});

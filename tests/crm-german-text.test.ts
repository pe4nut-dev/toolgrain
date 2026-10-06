import { describe,it,expect } from 'vitest';
import { normalizeGermanTextForComparison } from '../src/lib/crm/normalization';
import { parseCsvText } from '../src/lib/csv/parse-csv';
import { detectColumns } from '../src/lib/csv/detect-columns';
import { analyzeCrm } from '../src/lib/crm/analyze-crm';
import { duplicateMatchReasons } from '../src/lib/crm/types';
import { createCleaningSession } from '../src/lib/crm/clean/apply-fixes';
import { exportCleanedCsv } from '../src/lib/crm/clean/export-csv';
function custom(a:string,b:string,enabled=true){const csv=parseCsvText('location,label\n'+a+',A\n'+b+',B');return {csv,analysis:analyzeCrm(csv,detectColumns(csv.columns),{mode:'specific',selectedColumns:['column_0'],normalizeGermanText:enabled})};}
describe('German comparison normalization',()=>{
 it.each([['München','Muenchen'],['Müller','Mueller'],['Schröder','Schroeder'],['Jäger','Jaeger'],['Straße','Strasse'],['MÜNCHEN','muenchen'],['STRAẞE','strasse']])('matches %s and %s only internally',(a,b)=>expect(custom(a,b).analysis.duplicateGroups[0].kind).toBe('likely'));
 it('composes Unicode before replacing umlauts',()=>expect(normalizeGermanTextForComparison('  Mu\u0308nchen   Süd  ')).toBe('muenchen sued'));
 it('always normalizes manually chosen keys even without an option',()=>{const {csv}=custom('München','Muenchen');expect(analyzeCrm(csv,detectColumns(csv.columns),{mode:'specific',selectedColumns:['column_0']}).duplicateGroups).toHaveLength(1);expect(custom('München','Muenchen',false).analysis.duplicateGroups).toHaveLength(1);});
 it('preserves original Unicode values in session and export',()=>{const {csv,analysis}=custom('München','Muenchen');const before=JSON.stringify(csv);csv.rows.forEach(Object.freeze);const session=createCleaningSession(csv,analysis);expect(session.originalCsv.rows[0].column_0).toBe('München');expect(session.workingRows[0].column_0).toBe('München');expect(parseCsvText(exportCleanedCsv(session)).rows[0].column_0).toBe('München');expect(JSON.stringify(csv)).toBe(before);});
 it('uses German equivalence for automatic name/company identities',()=>{const csv=parseCsvText('first_name,last_name,company,location\nJäger,Müller,Schröder GmbH,München\nJaeger,Mueller,Schroeder GmbH,Muenchen');expect(analyzeCrm(csv,detectColumns(csv.columns)).duplicateGroups[0].matches[0].reasons).toEqual(['name_company']);});
 it('keeps automatic emails separate from German text normalization',()=>{const csv=parseCsvText('email,label\nmüller@example.com,A\nmueller@example.com,B');const a=analyzeCrm(csv,detectColumns(csv.columns),{mode:'automatic',normalizeGermanText:true});expect(a.duplicateGroups).toEqual([]);expect(csv.rows[0].column_0).toBe('müller@example.com');});
 it('does not transliterate arbitrary identifiers automatically',()=>{const csv=parseCsvText('id,invoice\nMünchen,001\nMuenchen,1');expect(analyzeCrm(csv,detectColumns(csv.columns),{normalizeGermanText:true}).duplicateGroups).toEqual([]);});
 it('keeps punctuation, suffixes and leading zeros significant when enabled',()=>{for(const [a,b] of [['A-B','AB'],['001','1'],['224322318','224322318-1']])expect(custom(a,b).analysis.duplicateGroups).toEqual([]);});
 it('explains normalized selected key matching using original spelling',()=>{const {analysis}=custom('München','Muenchen');expect(duplicateMatchReasons(analysis.duplicateGroups[0].matches[0])[0]).toContain('Same selected key after text normalization');expect(analysis.duplicateGroups[0].selectedKey![0].value).toBe('München');});
 it('handles 10,000 rows without all-pairs matching',()=>{const csv=parseCsvText('city,label\n'+Array.from({length:10000},(_,i)=>(i%2?'Muenchen':'München')+','+i).join('\n'));const start=performance.now();const a=analyzeCrm(csv,detectColumns(csv.columns),{mode:'specific',selectedColumns:['column_0'],normalizeGermanText:true});expect(a.duplicateGroups).toHaveLength(1);expect(a.duplicateGroups[0].matches).toHaveLength(9999);expect(performance.now()-start).toBeLessThan(5000);});
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Module from 'node:module';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(relativePath) {
  const filename = path.join(root, relativePath);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled._compile(output, filename);
  return compiled.exports;
}
const {parseCsvText, CsvError} = load('src/lib/csv/parse-csv.ts');
const {detectColumns} = load('src/lib/csv/detect-columns.ts');
const checks = [
  ['comma, UTF-8, quoted delimiters, original strings', () => {
    const csv = parseCsvText('first_name,last_name,company,email,phone,location\r\n"  Alex  ",Müller,"Acme, Inc.",alex@example.test,001234,Berlin\r\nSam,Lee,,sam@example.test,,Paris\r\n');
    assert.equal(csv.rows.length, 2); assert.equal(csv.columns.length, 6); assert.equal(csv.delimiter, ',');
    assert.equal(csv.rows[0].column_0, '  Alex  '); assert.equal(csv.rows[0].column_1, 'Müller');
    assert.equal(csv.rows[0].column_2, 'Acme, Inc.'); assert.equal(csv.rows[0].column_4, '001234');
    assert.equal(csv.rows[1].column_2, ''); assert.equal(csv.rows[1].column_4, '');
    assert.equal(detectColumns(csv.columns).filter(field=>field.columns.length).length, 6);
  }],
  ['semicolon and BOM', () => {const csv=parseCsvText('\uFEFFFirst Name;E-MAIL\nAlex;alex@example.test');assert.equal(csv.delimiter,';');assert.deepEqual(csv.columns.map(c=>c.name),['First Name','E-MAIL']);assert.equal(detectColumns(csv.columns).find(f=>f.field==='email').columns.length,1)}],
  ['duplicate headers retain both values', () => {const csv=parseCsvText('email,email\na@example.test,b@example.test');assert.equal(csv.warnings[0],'Some columns have duplicate names.');assert.deepEqual(csv.columns.map(c=>c.name),['email','email']);assert.deepEqual(Object.values(csv.rows[0]),['a@example.test','b@example.test'])}],
  ['special object keys cannot overwrite data', () => {const csv=parseCsvText('__proto__,constructor\noriginal,second');assert.deepEqual(Object.values(csv.rows[0]),['original','second'])}],
  ['escaped quotes and multiline cells', () => {const csv=parseCsvText('name,note\nAlex,"a ""quoted"" value\nsecond line"');assert.equal(csv.rows[0].column_1,'a "quoted" value\nsecond line')}],
  ['single-column CSV', () => {const csv=parseCsvText('email\na@example.test\nb@example.test');assert.equal(csv.rows.length,2);assert.equal(csv.columns.length,1)}],
  ['all-empty cells retained, blank physical lines skipped', () => {const csv=parseCsvText('name,email\n,\n\nAlex,\n');assert.equal(csv.rows.length,2);assert.deepEqual(Object.values(csv.rows[0]),['',''])}],
  ['empty and header-only rejected', () => {for(const text of ['', ' \r\n', 'name,email\n'])assert.throws(()=>parseCsvText(text),e=>e instanceof CsvError&&e.code==='empty')}],
  ['blank and all-numeric headers rejected', () => {for(const text of [',\nAlex,x', '1,2\n3,4'])assert.throws(()=>parseCsvText(text),e=>e.code==='header')}],
  ['unknown headers accepted without CRM matches', () => {const csv=parseCsvText('custom_id,notes\n001,original');assert.equal(detectColumns(csv.columns).filter(f=>f.columns.length).length,0)}],
  ['malformed quotes and field counts rejected', () => {for(const text of ['name,email\n"Alex,x', 'name,email\nAlex,x,y', 'name,email\nAlex'])assert.throws(()=>parseCsvText(text),e=>e.code==='parse')}],
  ['binary null content rejected', () => assert.throws(()=>parseCsvText('name\n\u0000'),e=>e.code==='parse')],
  ['header aliases are case-insensitive and preserve labels', () => {const names=[' GIVEN_NAME ','Family Name','Contact_Name','Organisation','E-Mail','Mobile Phone','Country'];const result=detectColumns(names.map((name,index)=>({key:String(index),name})));assert.equal(result.filter(f=>f.columns.length).length,7);assert.equal(result[0].columns[0].name,' GIVEN_NAME ')}],
  ['large row count is complete', () => {const csv=parseCsvText('name,email\n'+Array.from({length:5000},(_,i)=>'Person '+i+',person'+i+'@example.test').join('\n'));assert.equal(csv.rows.length,5000)}],
];
let failed=0;
for(const [name,check] of checks){try{check();console.log('PASS '+name)}catch(error){failed++;console.error('FAIL '+name);console.error(error.message)}}
if(failed)process.exitCode=1;else console.log(checks.length+' CSV checks passed.');

import type { ParsedCsv } from '../csv/types';
import type { FieldColumns } from './fields';
import { firstValue } from './fields';
import { normalizeCompany, normalizeIdentity } from './normalization';
import { emailProblem, normalizeEmail } from './email-analysis';
import { normalizePhone } from './phone-analysis';
import type { DuplicateGroup, DuplicateMatch, DuplicateReason } from './types';

export function detectDuplicates(csv: ParsedCsv, fields: FieldColumns): DuplicateGroup[] {
  const parents=csv.rows.map((_,index)=>index);
  function root(index:number):number { while(parents[index]!==index){parents[index]=parents[parents[index]];index=parents[index]}return index; }
  function union(a:number,b:number){const ra=root(a),rb=root(b);if(ra!==rb)parents[Math.max(ra,rb)]=Math.min(ra,rb);}
  const pairs=new Map<string,DuplicateMatch>();
  function match(a:number,b:number,reason:DuplicateReason){
    if(a===b)return;
    const rows:[number,number]=[Math.min(a,b)+1,Math.max(a,b)+1];
    const key=rows.join(':');
    const existing=pairs.get(key);
    if(existing){if(!existing.reasons.includes(reason))existing.reasons.push(reason)}else pairs.set(key,{rows,reasons:[reason]});
    union(a,b);
  }
  const exactBuckets=new Map<string,number[]>();
  const fingerprints=csv.rows.map(row=>JSON.stringify(csv.columns.map(column=>(row[column.key]??'').trim())));
  csv.rows.forEach((row,index)=>{
    if(csv.columns.every(column=>!(row[column.key]??'').trim()))return;
    const bucket=exactBuckets.get(fingerprints[index]);
    if(bucket){match(bucket[0],index,'exact_values');bucket.push(index)}else exactBuckets.set(fingerprints[index],[index]);
  });
  const emailIndex=new Map<string,number>(),phoneIndex=new Map<string,number>(),identityIndex=new Map<string,number>();
  function indexSignal(index:Map<string,number>,value:string,row:number,reason:DuplicateReason){
    if(!value)return;
    const first=index.get(value);
    if(first===undefined)index.set(value,row);
    else if(fingerprints[first]!==fingerprints[row])match(first,row,reason);
  }
  csv.rows.forEach((row,index)=>{
    for(const column of fields.email){const value=normalizeEmail(row[column.key]??'');if(value&&!emailProblem(value))indexSignal(emailIndex,value,index,'email')}
    for(const column of fields.phone)indexSignal(phoneIndex,normalizePhone(row[column.key]??''),index,'phone');
    const first=normalizeIdentity(firstValue(row,fields.first_name));
    const last=normalizeIdentity(firstValue(row,fields.last_name));
    const full=firstValue(row,fields.full_name).trim();
    const name=first&&last?JSON.stringify([first,last]):!first&&!last&&full.split(/\s+/).length>=2?normalizeIdentity(full):'';
    const company=normalizeCompany(firstValue(row,fields.company));
    if(name&&company)indexSignal(identityIndex,JSON.stringify([name,company]),index,'name_company');
  });
  const buckets=new Map<number,number[]>();
  csv.rows.forEach((_,index)=>{const key=root(index);const bucket=buckets.get(key);if(bucket)bucket.push(index+1);else buckets.set(key,[index+1])});
  const matchesByRoot=new Map<number,DuplicateMatch[]>();
  for(const pair of pairs.values()){const key=root(pair.rows[0]-1);const matches=matchesByRoot.get(key);if(matches)matches.push(pair);else matchesByRoot.set(key,[pair])}
  const exactByRoot=new Map<number,number[][]>();
  for(const bucket of exactBuckets.values())if(bucket.length>1){const key=root(bucket[0]);const group=exactByRoot.get(key);const rows=bucket.map(index=>index+1);if(group)group.push(rows);else exactByRoot.set(key,[rows])}
  return Array.from(buckets.entries()).filter(([,rows])=>rows.length>1).map(([key,rows],index)=>({
    id:'duplicate-'+(index+1),
    kind:rows.every(row=>fingerprints[row-1]===fingerprints[rows[0]-1])?'exact':'likely',
    rows,
    matches:matchesByRoot.get(key)??[],
    exactSubgroups:exactByRoot.get(key)??[],
  }));
}

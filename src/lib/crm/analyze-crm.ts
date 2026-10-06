import type { CrmFieldType, CsvColumn, DetectedColumn, ParsedCsv } from '../csv/types';
import { fieldColumns, isMissingValue } from './fields';
import { detectDuplicates } from './duplicate-detection';
import { detectEmailColumns } from './detect-email-columns';
import { emailProblem } from './email-analysis';
import { normalizePhone, phoneStyle } from './phone-analysis';
import { suggestedNameCase } from './normalization';
import { issueDefinitions, type DuplicateDetectionConfig, type CrmAnalysis, type CrmIssue, type CrmIssueType } from './types';

export function analyzeCrm(csv:ParsedCsv, detected:readonly DetectedColumn[], config:DuplicateDetectionConfig = {}):CrmAnalysis {
  const fields=fieldColumns(detected);
  const emailColumns=detectEmailColumns(csv.columns);
  const issues:CrmIssue[]=[];
  function cellIssue(type:CrmIssueType,row:number,field:CrmFieldType,column:CsvColumn,reason:string,suggestedValue?:string){issues.push({id:'issue-'+(issues.length+1),type,severity:issueDefinitions[type].severity,rows:[row],field,columnName:column.name,columnKey:column.key,originalValues:[{row,value:csv.rows[row-1][column.key]??''}],reason,suggestedValue})}
  const missing:readonly {field:CrmFieldType;type:CrmIssueType}[]=[{field:'company',type:'missing_company'},{field:'location',type:'missing_location'},{field:'email',type:'missing_email'},{field:'phone',type:'missing_phone'}];
  const phones:{row:number;column:CsvColumn;style:string}[]=[];
  const styles=new Map<string,number>();
  csv.rows.forEach((row,index)=>{
    const rowNumber=index+1;
    for(const {field,type} of missing){const columns=fields[field];if(columns.length&&columns.every(column=>isMissingValue(row[column.key])))cellIssue(type,rowNumber,field,columns[0],'All detected '+field+' fields in this row are empty or whitespace-only.')}
    for(const column of emailColumns){const value=row[column.key]??'';if(isMissingValue(value))continue;const problem=emailProblem(value);if(problem)cellIssue('invalid_email',rowNumber,'email',column,problem);else if(value!==value.toLowerCase())cellIssue('email_case',rowNumber,'email',column,'Email uses uppercase letters. Lowercase is suggested for consistency.',value.toLowerCase())}
    for(const field of ['first_name','last_name'] as const)for(const column of fields[field]){const value=row[column.key]??'';const suggested=suggestedNameCase(value);if(suggested)cellIssue('name_capitalization',rowNumber,field,column,'A simple name is entirely lowercase or uppercase. Review this suggestion before applying it.',suggested)}
    for(const column of fields.phone){const value=row[column.key]??'';if(normalizePhone(value)){const style=phoneStyle(value);styles.set(style,(styles.get(style)??0)+1);phones.push({row:rowNumber,column,style})}}
  });
  if(styles.size>1){
    const dominant=Array.from(styles.entries()).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
    for(const phone of phones)if(phone.style!==dominant)cellIssue('phone_format',phone.row,'phone',phone.column,'This phone uses '+phone.style+' while the most common presentation in this file is '+dominant+'. This is a consistency suggestion only; no country or international standard is inferred.');
  }
  const duplicateGroups=detectDuplicates(csv,fields,config);
  for(const group of duplicateGroups){
    for(const rows of group.exactSubgroups)issues.push({id:'issue-'+(issues.length+1),type:'exact_duplicate',severity:issueDefinitions.exact_duplicate.severity,rows,field:'record',originalValues:rows.map(row=>({row,value:csv.rows[row-1]})),reason:'All CSV column values match after trimming.',duplicateGroupId:group.id});
    if(group.kind==='likely')issues.push({id:'issue-'+(issues.length+1),type:'likely_duplicate',severity:issueDefinitions.likely_duplicate.severity,rows:group.rows,field:'record',originalValues:group.rows.map(row=>({row,value:csv.rows[row-1]})),reason:group.selectedKey?(group.textNormalized?'Same selected key after text normalization. Review the original values before choosing which rows to keep.':'Same selected duplicate key. Other fields differ; review the original values before choosing which rows to keep.'):group.matches.some(match=>match.reasons.includes('custom_key'))?'Connected by automatic CRM signals or the selected duplicate key column. Check individual match reasons; not every pair necessarily matches.':'Connected by shared email, phone or normalized name + company. Check individual match reasons; not every pair in a group necessarily matches.',duplicateGroupId:group.id});
  }
  const counts=Object.fromEntries(Object.keys(issueDefinitions).map(type=>[type,0])) as Record<CrmIssueType,number>;
  const affected=new Set<number>();
  for(const issue of issues){counts[issue.type]++;for(const row of issue.rows)affected.add(row)}
  return {issues,duplicateGroups,counts,affectedRows:affected.size,contacts:csv.rows.length};
}

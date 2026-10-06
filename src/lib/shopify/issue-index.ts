import type {ShopifyField} from './fields';
import type {ValidationIssue,ShopifyResult} from './types';
export type IssueIndex={cells:Map<number,Map<ShopifyField,ValidationIssue[]>>;rowNotes:Map<number,ValidationIssue[]>;globalFields:Map<ShopifyField,ValidationIssue[]>;globalNotes:ValidationIssue[];affectedRows:number[]};
export function indexOutputIssues(result:ShopifyResult):IssueIndex {
 const cells=new Map<number,Map<ShopifyField,ValidationIssue[]>>(),rowNotes=new Map<number,ValidationIssue[]>(),globalFields=new Map<ShopifyField,ValidationIssue[]>(),globalNotes:ValidationIssue[]=[],affected=new Set<number>();
 for(const issue of result.issues){
  const outputField=issue.field&&result.fields.includes(issue.field)?issue.field:undefined;
  if(!issue.rows.length){if(outputField)globalFields.set(outputField,[...(globalFields.get(outputField)??[]),issue]);else globalNotes.push(issue);continue;}
  for(const row of issue.rows){affected.add(row);if(outputField){let fields=cells.get(row);if(!fields){fields=new Map();cells.set(row,fields);}fields.set(outputField,[...(fields.get(outputField)??[]),issue]);}else rowNotes.set(row,[...(rowNotes.get(row)??[]),issue]);}
 }
 if(globalFields.size)for(let row=1;row<=result.rows.length;row++)affected.add(row);
 return {cells,rowNotes,globalFields,globalNotes,affectedRows:[...affected].sort((a,b)=>a-b)};
}
export function cellIssues(index:IssueIndex,row:number,field:ShopifyField):ValidationIssue[]{return [...(index.globalFields.get(field)??[]),...(index.cells.get(row)?.get(field)??[])];}
export function issueSeverity(issues:readonly ValidationIssue[]):ValidationIssue['severity']|undefined{return issues.some(i=>i.severity==='error')?'error':issues.some(i=>i.severity==='warning')?'warning':issues.length?'suggestion':undefined;}

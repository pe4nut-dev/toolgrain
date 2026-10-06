import type {ShopifyField} from './fields';
import type {ShopifyResult,TransformOptions} from './types';
import {transformSupplier} from './transform';
import {parseCsvText} from '../csv/parse-csv';
import Papa from 'papaparse';
import {parsePrice} from './price';
import {generateHandle,uniqueHandles} from './handle';
export const editableFields:readonly ShopifyField[]=['Title','URL handle','SKU','Barcodes','Price','Compare-at price','Cost per item','Inventory quantity','Product image URL','Image alt text','Vendor','Type','Tags','Status'];
export type WorkingOutput={baseline:ShopifyResult;result:ShopifyResult;handles:('mapped'|'generated'|'manual')[];edits:number;resetEpoch:number};
export function createWorkingOutput(result:ShopifyResult):WorkingOutput{return {baseline:result,result:{...result,rows:result.rows.map(row=>({...row}))},handles:result.rows.map(()=>result.summary.generatedHandles?'generated':'mapped'),edits:0,resetEpoch:0};}
export function resetWorkingOutput(state:WorkingOutput):WorkingOutput{return {...createWorkingOutput(state.baseline),resetEpoch:state.resetEpoch+1};}
export function applyOutputEdit(state:WorkingOutput,rowNumber:number,field:ShopifyField,value:string,options:TransformOptions):WorkingOutput{
 if(!editableFields.includes(field)||!state.result.fields.includes(field)||!state.result.rows[rowNumber-1])throw Error('This output cell cannot be edited.');
 const rows=state.result.rows.map(row=>({...row})),handles=[...state.handles];
 const monetary=['Price','Compare-at price','Cost per item'].includes(field);
 const parsed=monetary?parsePrice(value,options.priceFormat):{value};
 rows[rowNumber-1][field]=parsed.value;
 if(field==='URL handle')handles[rowNumber-1]='manual';
 if(field==='Title'&&handles[rowNumber-1]==='generated'){
  const reserved=rows.filter((_,i)=>handles[i]!=='generated').map(row=>row['URL handle']??'');
  const generated=rows.map((row,i)=>handles[i]==='generated'?generateHandle(row.Title??''):null);
  const unique=uniqueHandles([...reserved,...generated.filter((h):h is string=>h!==null)]);let n=reserved.length;
  rows.forEach((row,i)=>{if(handles[i]==='generated')row['URL handle']=unique[n++];});
 }
 // Reuse the canonical transformation validators against a separate output snapshot.
 // Already normalized monetary values use decimal-point format; new input is parsed above.
 const fields=state.result.fields,csv=parseCsvText(Papa.unparse({fields,data:rows.map(row=>fields.map(f=>row[f]??''))}));
 const mapping=Object.fromEntries(fields.map((f,i)=>[f,csv.columns[i].key]));
 const checked=transformSupplier(csv,mapping,{...options,priceFormat:'point',uniqueMappedHandles:false});
 checked.issues=checked.issues.filter(issue=>!(monetary&&issue.field===field&&issue.rows.includes(rowNumber)));
 if(monetary){if(parsed.error)checked.issues.push({type:field==='Price'?'invalid_price':field==='Compare-at price'?'invalid_compare_at_price':'invalid_cost',severity:'error',field,rows:[rowNumber],message:parsed.error});else if(!parsed.value&&field==='Price')checked.issues.push({type:'empty_price',severity:'warning',field,rows:[rowNumber],message:'Empty Price imports at Shopify’s default price. Review before importing.'});checked.rows[rowNumber-1][field]=parsed.value;}
 for(const priceField of ['Price','Compare-at price','Cost per item'] as const){
 const existing=state.result.issues.filter(i=>i.field===priceField&&i.severity==='error'&&!(monetary&&priceField===field&&i.rows.includes(rowNumber)));
 for(const issue of existing){checked.issues=checked.issues.filter(i=>!(i.field===priceField&&i.rows.some(row=>issue.rows.includes(row))));checked.issues.push(issue);for(const row of issue.rows)checked.rows[row-1][priceField]=rows[row-1][priceField];}
 }
 checked.issues.push(...state.baseline.issues.filter(issue=>issue.type==='mapping_error'||issue.type==='reused_source'||(!issue.field&&issue.type==='possible_variant_rows')));
 checked.summary={...state.baseline.summary,errors:checked.issues.filter(i=>i.severity==='error').length,warnings:checked.issues.filter(i=>i.severity==='warning').length};
 return {...state,result:checked,handles,edits:state.edits+1};
}

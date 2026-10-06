import type {ParsedCsv} from '../csv/types';
import {shopifyFields,type ShopifyField} from './fields';
import {defaultOptions,type Mapping,type TransformOptions,type ShopifyResult,type ValidationIssue} from './types';
import {generateHandle,uniqueHandles,validHandle} from './handle';
import {parsePrice} from './price';
import {duplicateRows,imageIssue} from './validate';
export function transformSupplier(csv:ParsedCsv,mapping:Mapping,options:TransformOptions=defaultOptions):ShopifyResult {
 const issues:ValidationIssue[]=[];
 const add=(issue:ValidationIssue)=>issues.push(issue);
 const keys=new Set(csv.columns.map(c=>c.key));
 const mapped=shopifyFields.filter(f=>!!mapping[f]);
 for(const field of mapped)if(!keys.has(mapping[field]!))add({type:'mapping_error',severity:'error',rows:[],field,message:'Choose a valid source column for '+field+'.'});
 const used=new Map<string,ShopifyField[]>();for(const field of mapped){const key=mapping[field]!;used.set(key,[...(used.get(key)??[]),field]);}
 for(const fields of used.values())if(fields.length>1)add({type:'reused_source',severity:'warning',rows:[],message:'One supplier column is reused for '+fields.join(', ')+'. Review this mapping.'});
 if(!mapping.Title)add({type:'missing_title',severity:'error',rows:[],field:'Title',message:'Title is required for Shopify product imports. Choose a Title column.'});
 const fields=shopifyFields.filter(f=>f==='Title'||f==='URL handle'||f==='Status'||f==='Published on online store'||!!mapping[f]);
 const rows=csv.rows.map((source,index)=>{
  const row=index+1,output:Partial<Record<ShopifyField,string>>={};
  for(const field of fields)output[field]=mapping[field]?source[mapping[field]!]??'':'';
  if(!output.Title?.trim())add({type:'missing_title',severity:'error',rows:[row],field:'Title',message:'Title is required for Shopify product imports.'});
  output['URL handle']=mapping['URL handle']?output['URL handle']!:generateHandle(output.Title??'');
  if(mapping['URL handle']&&!validHandle(output['URL handle']!))add({type:'invalid_handle',severity:'error',rows:[row],field:'URL handle',message:'Mapped handles must contain letters, numbers and single hyphens only, without whitespace. Original mapped handles are not rewritten.'});
  const status=mapping.Status?output.Status!.trim().toLowerCase():options.status;
  output.Status=status;if(!['active','draft','archived'].includes(status))add({type:'invalid_status',severity:'error',rows:[row],field:'Status',message:'Status must be active, draft or archived.'});
  const published=mapping['Published on online store']?output['Published on online store']!.trim().toLowerCase():String(options.published);
  output['Published on online store']=published;if(!['true','false'].includes(published))add({type:'invalid_published',severity:'error',rows:[row],field:'Published on online store',message:'Published on online store must be true or false.'});
  for(const [field,type] of [['Price','invalid_price'],['Compare-at price','invalid_compare_at_price'],['Cost per item','invalid_cost']] as const)if(mapping[field]){const price=parsePrice(output[field]!,options.priceFormat);output[field]=price.value;if(price.error)add({type,severity:'error',rows:[row],field,message:price.error});else if(!price.value&&field==='Price')add({type:'empty_price',severity:'warning',rows:[row],field,message:'Empty Price imports at Shopify’s default price. Review before importing.'});}
  if(mapping['Inventory quantity']){const stock=output['Inventory quantity']!.trim();if(!/^\d+$/.test(stock))add({type:'invalid_inventory',severity:'error',rows:[row],field:'Inventory quantity',message:'Inventory quantity must be an integer greater than or equal to zero.'});else output['Inventory quantity']=stock.replace(/^0+(?=\d)/,'');}
  if(mapping.Barcodes)output.Barcodes=output.Barcodes!.trim();
  if(mapping['Product image URL']){const issue=imageIssue(output['Product image URL']!,row);if(issue)add(issue);}
  if(mapping['Image alt text']&&(output['Image alt text']?.length??0)>512)add({type:'invalid_image_url',severity:'error',rows:[row],field:'Image alt text',message:'Image alt text must not exceed 512 characters.'});
  return output;
 });
 const originalHandles=rows.map(row=>row['URL handle']!);
 const duplicateHandles=duplicateRows(originalHandles.map(h=>h.toLowerCase()));
 for(const group of duplicateHandles)add({type:'possible_variant_rows',severity:'warning',rows:group,field:'URL handle',message:'Multiple rows appear to share the same product identifier. This may represent variants, which are not supported in this version.'});
 if(!mapping['URL handle']||options.uniqueMappedHandles){const handles=uniqueHandles(originalHandles);handles.forEach((handle,index)=>{if(handle!==originalHandles[index])add({type:'handle_adjusted',severity:'suggestion',rows:[index+1],field:'URL handle',message:'Handle adjusted from '+originalHandles[index]+' to '+handle+' to keep products unique.'});rows[index]['URL handle']=handle;});}
 else for(const group of duplicateHandles)add({type:'duplicate_handle',severity:'error',rows:group,field:'URL handle',message:'Duplicate mapped handles must be resolved or explicitly made unique.'});
 if(mapping.SKU)for(const group of duplicateRows(rows.map(row=>(row.SKU??'').trim()))){add({type:'duplicate_sku',severity:'warning',rows:group,field:'SKU',message:'Duplicate SKU. Original SKU values are unchanged.'});add({type:'possible_variant_rows',severity:'warning',rows:group,field:'SKU',message:'Multiple rows appear to share the same product identifier. This may represent variants, which are not supported in this version.'});}
 // Recognize explicit product identifiers even if they are not mapped to a target field.
 const identifiers=csv.columns.filter(c=>/^(productid|productidentifier|parentid|parentproductid|produktid)$/i.test(c.name.replace(/[\s_-]/g,'')));
 for(const column of identifiers)for(const group of duplicateRows(csv.rows.map(row=>(row[column.key]??'').trim())))add({type:'possible_variant_rows',severity:'warning',rows:group,message:'Multiple rows share '+column.name+'. This may represent variants, which are not supported in this version.'});
 if(mapping['Product category'])add({type:'category_review',severity:'warning',rows:[],field:'Product category',message:'Product category must match Shopify’s standard taxonomy. Category validity is not verified by this tool.'});
 return {fields,rows,issues,summary:{products:rows.length,mappedFields:mapped.length,generatedHandles:mapping['URL handle']?0:rows.length,errors:issues.filter(i=>i.severity==='error').length,warnings:issues.filter(i=>i.severity==='warning').length}};
}

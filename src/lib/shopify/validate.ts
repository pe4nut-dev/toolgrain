import type {ValidationIssue,ShopifyResult} from './types';
export function duplicateRows(values:readonly string[]):number[][] {
 const groups=new Map<string,number[]>();values.forEach((value,i)=>{if(!value)return;const group=groups.get(value);if(group)group.push(i+1);else groups.set(value,[i+1]);});return [...groups.values()].filter(group=>group.length>1);
}
export function imageIssue(value:string,row:number):ValidationIssue|undefined {
 if(!value.trim())return {type:'invalid_image_url',severity:'warning',rows:[row],field:'Product image URL',message:'Mapped image URL is empty; no image will be imported.'};
 try{const url=new URL(value);if(!/^https?:\/\//i.test(value)||!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password||/\s/.test(value))throw Error();if(url.protocol==='http:')return {type:'invalid_image_url',severity:'warning',rows:[row],field:'Product image URL',message:'Prefer HTTPS for publicly accessible image URLs.'};}catch{return {type:'invalid_image_url',severity:'error',rows:[row],field:'Product image URL',message:'Use a valid public http:// or https:// image URL. URLs are not fetched or checked for availability.'};}
}
export function canExport(result:ShopifyResult):boolean{return result.rows.length>0&&!result.issues.some(i=>i.severity==='error');}

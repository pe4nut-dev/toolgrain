// A payload-only hook: Umami still owns automatic pageviews and navigation tracking.
// Keep this factory self-contained: the server serializes it into the pre-load guard.
import { sanitizeToolgrainEvent } from './analytics-events';
export function createUmamiPrivacyFilter(paths:readonly string[],websiteId:string, validateEvent = sanitizeToolgrainEvent){
 const allowed=new Set(paths);
 return (type:string,payload:unknown)=>{
  if(type!=='event'||!payload||typeof payload!=='object')return false;
  const value=payload as Record<string,unknown>;
  if(value.id||typeof value.url!=='string')return false;
  const event = value.name === undefined ? null : validateEvent(value.name, value.data);
  if (value.name !== undefined && !event) return false;
  if (!event && value.data) return false;
  if(typeof value.hostname!=='string'||!['toolgrain.com','www.toolgrain.com','localhost','127.0.0.1'].includes(value.hostname))return false;
  try{
   const url=new URL(value.url,'https://'+value.hostname);
   if(url.hostname!==value.hostname||(!allowed.has(url.pathname)&&!(event?.name==='upgrade_clicked'&&url.pathname==='/account')))return false;
   // Allowlist fields, rather than copying user-controlled or future custom payloads.
   const result:Record<string,unknown>={website:websiteId,hostname:value.hostname,url:url.pathname,title:'Toolgrain',referrer:''};
   if (event) { result.name = event.name; result.data = event.data; }
   if(typeof value.referrer==='string'&&value.referrer){try{const referrer=new URL(value.referrer,'https://'+value.hostname);if(referrer.protocol==='https:'||referrer.protocol==='http:')result.referrer=referrer.origin;}catch{/* Drop malformed referrers. */}}
   if(typeof value.screen==='string'&&/^\d{1,5}x\d{1,5}$/.test(value.screen))result.screen=value.screen;
   if(typeof value.language==='string'&&/^[a-zA-Z-]{2,35}$/.test(value.language))result.language=value.language;
   return result;
  }catch{return false;}
 };
}

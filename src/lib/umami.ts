// A payload-only hook: Umami still owns automatic pageviews and navigation tracking.
// Keep this factory self-contained: the server serializes it into the pre-load guard.
export function createUmamiPrivacyFilter(paths:readonly string[],websiteId:string){
 const allowed=new Set(paths);
 return (type:string,payload:unknown)=>{
  if(type!=='event'||!payload||typeof payload!=='object')return false;
  const value=payload as Record<string,unknown>;
  if(value.name||value.id||value.data||typeof value.url!=='string')return false;
  if(typeof value.hostname!=='string'||!['toolgrain.com','www.toolgrain.com','localhost','127.0.0.1'].includes(value.hostname))return false;
  try{
   const url=new URL(value.url,'https://'+value.hostname);
   if(url.hostname!==value.hostname||!allowed.has(url.pathname))return false;
   // Allowlist fields, rather than copying user-controlled or future custom payloads.
   const result:Record<string,string>={website:websiteId,hostname:value.hostname,url:url.pathname,title:'Toolgrain',referrer:''};
   if(typeof value.referrer==='string'&&value.referrer){try{const referrer=new URL(value.referrer,'https://'+value.hostname);if(referrer.protocol==='https:'||referrer.protocol==='http:')result.referrer=referrer.origin;}catch{/* Drop malformed referrers. */}}
   if(typeof value.screen==='string'&&/^\d{1,5}x\d{1,5}$/.test(value.screen))result.screen=value.screen;
   if(typeof value.language==='string'&&/^[a-zA-Z-]{2,35}$/.test(value.language))result.language=value.language;
   return result;
  }catch{return false;}
 };
}

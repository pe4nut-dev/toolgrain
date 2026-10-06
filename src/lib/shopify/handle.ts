export function generateHandle(title:string):string {
 return title.normalize('NFC').trim().toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'product';
}
export function validHandle(value:string):boolean{return /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value);}
// Reserve source bases so a suffix cannot steal a later product's natural handle.
export function uniqueHandles(values:readonly string[]):string[]{
 const reserved=new Set(values.map(v=>v.toLowerCase())),used=new Set<string>(),next=new Map<string,number>();
 return values.map(base=>{const key=base.toLowerCase();if(!used.has(key)){used.add(key);return base;}let n=next.get(key)??2;while(reserved.has((base+'-'+n).toLowerCase())||used.has((base+'-'+n).toLowerCase()))n++;next.set(key,n+1);const unique=base+'-'+n;used.add(unique.toLowerCase());return unique;});
}

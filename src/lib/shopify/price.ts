import type {PriceFormat} from './types';
export type PriceResult={value:string;error?:string};
export function parsePrice(source:string,format:PriceFormat):PriceResult {
 const raw=source.trim();if(!raw)return {value:''};
 const text=raw.replace(/^[€$£]\s*/,'').replace(/\s*[€$£]$/,'');
 const invalid=()=>({value:source,error:'Invalid monetary value. Use a non-negative number and review the price format.'});
 if((raw.match(/[€$£]/g)??[]).length>1||!/^\d+(?:[.,]\d+)*$/.test(text))return invalid();
 let decimal:string|undefined;
 if(format==='comma')decimal=',';else if(format==='point')decimal='.';
 else if(text.includes(',')&&text.includes('.'))decimal=text.lastIndexOf(',')>text.lastIndexOf('.')?',':'.';
 else {const sep=text.includes(',')?',':text.includes('.')?'.':undefined;if(sep){const parts=text.split(sep);if(parts.length!==2||parts[1].length===3)return {value:source,error:'Ambiguous monetary value. Choose Decimal comma or Decimal point to resolve it.'};decimal=sep;}}
 const grouping=decimal===','?'.':',';
 const parts=decimal?text.split(decimal):[text];if(parts.length>2)return invalid();
 const integer=parts[0];if(integer.includes(grouping)&&!new RegExp('^\\d{1,3}(?:\\'+grouping+'\\d{3})+$').test(integer))return invalid();
 const clean=integer.split(grouping).join('');if(!/^\d+$/.test(clean))return invalid();
 const fraction=parts[1];if(fraction!==undefined&&!/^\d+$/.test(fraction))return invalid();
 return {value:clean.replace(/^0+(?=\d)/,'')+(fraction!==undefined?'.'+fraction:'')};
}

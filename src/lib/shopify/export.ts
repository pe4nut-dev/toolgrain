import Papa from 'papaparse';
import {exportFilename,downloadComparisonExport} from '../csv-compare/export-csv';
import {canExport} from './validate';
import type {ShopifyResult} from './types';
export function exportShopifyCsv(result:ShopifyResult,sourceFilename:string){
 if(!canExport(result))throw new Error('Resolve blocking validation errors before export.');
 return {csv:Papa.unparse({fields:result.fields,data:result.rows.map(row=>result.fields.map(field=>row[field]??''))},{delimiter:',',newline:'\n'}),filename:exportFilename(sourceFilename||'supplier-products','shopify'),rowCount:result.rows.length,delimiter:','};
}
export function downloadShopifyCsv(result:ShopifyResult,filename:string){downloadComparisonExport(exportShopifyCsv(result,filename));}

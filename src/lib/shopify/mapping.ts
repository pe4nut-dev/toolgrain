import {normalizeHeader} from '../csv/detect-columns';
import type {CsvColumn} from '../csv/types';
import {shopifyFields,type ShopifyField} from './fields';
import type {Mapping} from './types';
const aliases:Partial<Record<ShopifyField,readonly string[]>>={
 Title:['title','product_name','name','artikelname','produktname','bezeichnung'],
 'URL handle':['url_handle','handle','slug'],Description:['description','beschreibung','product_description'],
 Vendor:['vendor','brand','manufacturer','hersteller','marke'],
 SKU:['sku','article_number','artikelnummer','item_number','item no'],
 Price:['price','retail_price','sale_price','vk','verkaufspreis'],
 'Compare-at price':['compare_at_price','rrp','msrp','uvp'],'Cost per item':['cost','purchase_price','buy_price','ek','einkaufspreis'],
 'Inventory quantity':['stock','inventory','quantity','qty','bestand','lagerbestand'],
 Barcodes:['barcode','barcodes','ean','gtin','upc'],'Product image URL':['image','image_url','bild','bild_url'],
 Tags:['tags','keywords'],Type:['type','product_type','category_name'],
};
export function suggestMappings(columns:readonly CsvColumn[]):Mapping {
 const mapping:Mapping={};
 for(const field of shopifyFields){const exact=columns.filter(c=>normalizeHeader(c.name)===normalizeHeader(field));const allowed=new Set((aliases[field]??[]).map(normalizeHeader));const candidates=exact.length?exact:columns.filter(c=>allowed.has(normalizeHeader(c.name)));if(candidates.length===1)mapping[field]=candidates[0].key;}
 return mapping;
}

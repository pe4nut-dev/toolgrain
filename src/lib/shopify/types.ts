import type {ShopifyField} from './fields';
export type Mapping = Partial<Record<ShopifyField,string>>;
export type PriceFormat='auto'|'comma'|'point';
export type TransformOptions={status:'active'|'draft'|'archived';published:boolean;priceFormat:PriceFormat;uniqueMappedHandles:boolean};
export const defaultOptions:TransformOptions={status:'draft',published:false,priceFormat:'auto',uniqueMappedHandles:false};
export type IssueType='missing_title'|'invalid_handle'|'duplicate_handle'|'invalid_price'|'invalid_compare_at_price'|'invalid_cost'|'invalid_inventory'|'duplicate_sku'|'invalid_image_url'|'possible_variant_rows'|'invalid_status'|'invalid_published'|'reused_source'|'mapping_error'|'handle_adjusted'|'empty_price'|'category_review';
export type ValidationIssue={type:IssueType;severity:'error'|'warning'|'suggestion';rows:number[];field?:ShopifyField;message:string};
export type ShopifyResult={fields:ShopifyField[];rows:Partial<Record<ShopifyField,string>>[];issues:ValidationIssue[];summary:{products:number;mappedFields:number;generatedHandles:number;errors:number;warnings:number};};

// Current Shopify product CSV headers, verified against the official Help Center.
export const shopifyFields = ['Title','URL handle','Description','Vendor','Product category','Type','Tags','Published on online store','Status','SKU','Barcodes','Price','Compare-at price','Cost per item','Inventory quantity','Product image URL','Image alt text'] as const;
export type ShopifyField = typeof shopifyFields[number];
export const shopifyFormatUrl='https://help.shopify.com/en/manual/products/import-export/using-csv';

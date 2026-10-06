export type PlanId='free'|'pro';
export type PlanToolId='crm-csv-cleaner'|'csv-compare'|'supplier-csv-to-shopify';
export type Plan={name:string;description:string;monthlyPrice:number;annualPrice:number;fileSizeBytes:number;limits:Record<PlanToolId,number>;features:readonly string[]};
// Counts mean data rows excluding the header, per file for CSV Compare.
// Supplier rows represent products. MB follows the existing 1024² byte convention.
export const plans:Record<PlanId,Plan>={
 free:{name:'Free',description:'For occasional tasks and smaller files.',monthlyPrice:0,annualPrice:0,fileSizeBytes:10*1024*1024,limits:{'crm-csv-cleaner':500,'csv-compare':500,'supplier-csv-to-shopify':100},features:['Full local processing','Exports included']},
 pro:{name:'Pro',description:'For larger files and regular business use.',monthlyPrice:8.90,annualPrice:69,fileSizeBytes:25*1024*1024,limits:{'crm-csv-cleaner':50000,'csv-compare':50000,'supplier-csv-to-shopify':10000},features:['All current Toolgrain tools','Larger local processing limits','Future Pro limits/features where applicable']}
};
export const planTools:Record<PlanToolId,{name:string;unit:string;limitUnit:string}>={
 'crm-csv-cleaner':{name:'CRM CSV Cleaner',unit:'contacts',limitUnit:'rows'},
 'csv-compare':{name:'CSV Compare',unit:'rows',limitUnit:'rows per file'},
 'supplier-csv-to-shopify':{name:'Supplier CSV to Shopify',unit:'products',limitUnit:'products'}
};
export function formatPlanPrice(value:number){return new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:value===0?0:2,maximumFractionDigits:value===0?0:2}).format(value);}

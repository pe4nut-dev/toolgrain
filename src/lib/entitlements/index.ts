import {plans,type PlanId,type PlanToolId} from '../../config/plans';
// Anonymous fallback for pure usage checks. Tool UI receives a read-only
// server-verified profile plan through AccountProvider; no public plan setter.
export function getCurrentPlan():PlanId{return 'free';}
export function getToolLimit(plan:PlanId,tool:PlanToolId):number{return plans[plan].limits[tool];}
export function canProcessRows(plan:PlanId,tool:PlanToolId,rows:number):boolean{return Number.isSafeInteger(rows)&&rows>=0&&rows<=getToolLimit(plan,tool);}
export function canProcessFileSize(plan:PlanId,bytes:number):boolean{return Number.isSafeInteger(bytes)&&bytes>=0&&bytes<=plans[plan].fileSizeBytes;}
export function canCompareFiles(plan:PlanId,oldRows:number,newRows:number):boolean{return canProcessRows(plan,'csv-compare',oldRows)&&canProcessRows(plan,'csv-compare',newRows);}
export type UsageViolation={tool:PlanToolId;plan:PlanId;kind:'rows'|'file-size';actual:number;label:string;limit:number;proLimit:number;exceedsPro:boolean};
export function rowViolation(plan:PlanId,tool:PlanToolId,actual:number,label='This CSV'):UsageViolation|null{const limit=getToolLimit(plan,tool),proLimit=getToolLimit('pro',tool);return canProcessRows(plan,tool,actual)?null:{tool,plan,kind:'rows',actual,label,limit,proLimit,exceedsPro:actual>proLimit};}
export function fileSizeViolation(plan:PlanId,tool:PlanToolId,actual:number,label:string):UsageViolation|null{const limit=plans[plan].fileSizeBytes,proLimit=plans.pro.fileSizeBytes;return canProcessFileSize(plan,actual)?null:{tool,plan,kind:'file-size',actual,label,limit,proLimit,exceedsPro:actual>proLimit};}
export function fileSizeLimitMessage(plan:PlanId,bytes:number):string{return bytes>plans.pro.fileSizeBytes?'This file exceeds Toolgrain’s maximum supported file size.': 'This file exceeds the '+plans[plan].name+' plan file-size limit. View Pro for larger local processing limits.';}

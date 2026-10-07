import {formatPlanPrice,plans} from './plans';
export const billingCopy={
 monthly:{cycle:'Monthly',priceLabel:formatPlanPrice(plans.pro.monthlyPrice)+' / month'},
 annual:{cycle:'Annual',priceLabel:formatPlanPrice(plans.pro.annualPrice)+' / year'},
} as const;
export function cycleForPrice(price:string,prices:{monthly:string;annual:string}){
 if(prices.monthly===prices.annual)return null;
 return price===prices.monthly?'monthly':price===prices.annual?'annual':null;
}

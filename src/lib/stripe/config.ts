import 'server-only';
function environment(){return {
 secret:process.env.STRIPE_SECRET_KEY?.trim()??'',
 monthly:process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim()??'',
 annual:process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim()??'',
 webhook:process.env.STRIPE_WEBHOOK_SECRET?.trim()??'',
 admin:process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()??'',
};}
// Standard and restricted keys use the same server-side Stripe SDK authentication.
function serverKeyMode(key:string):'test'|'live'|'unknown'{const match=/^(?:sk|rk)_(test|live)_[A-Za-z0-9_]+$/.exec(key);return match?.[1]==='test'?'test':match?.[1]==='live'?'live':'unknown';}
function stripeReason(env:ReturnType<typeof environment>):string|null{
 if(!env.secret)return 'missing_stripe_secret';
 if(serverKeyMode(env.secret)==='unknown')return 'invalid_stripe_secret_format';
 if(!env.monthly)return 'missing_monthly_price';
 if(!/^price_[A-Za-z0-9_]+$/.test(env.monthly))return 'invalid_monthly_price_format';
 if(!env.annual)return 'missing_annual_price';
 if(!/^price_[A-Za-z0-9_]+$/.test(env.annual))return 'invalid_annual_price_format';
 if(env.monthly===env.annual)return 'identical_price_ids';
 return null;
}
export function stripeConfig(){const env=environment();if(stripeReason(env))return null;return {secret:env.secret,monthly:env.monthly,annual:env.annual};}
export function stripeWebhookSecret(){return environment().webhook;}
export type BillingAvailability={stripeSecretPresent:boolean;stripeSecretMode:'test'|'live'|'unknown';monthlyPricePresent:boolean;annualPricePresent:boolean;webhookSecretPresent:boolean;supabaseAdminPresent:boolean;unavailableReason:string|null};
export function billingAvailability():BillingAvailability{
 const env=environment();let unavailableReason=stripeReason(env);
 // A working webhook is a readiness requirement: never sell Pro without its trusted activation path.
 if(!unavailableReason){
  if(!env.webhook)unavailableReason='missing_webhook_secret';
  else if(!/^whsec_[^\s]+$/.test(env.webhook))unavailableReason='invalid_webhook_secret_format';
  else if(!env.admin)unavailableReason='missing_supabase_admin';
  else if(/\s/.test(env.admin))unavailableReason='invalid_supabase_admin_format';
 }
 return {stripeSecretPresent:!!env.secret,stripeSecretMode:serverKeyMode(env.secret),monthlyPricePresent:!!env.monthly,annualPricePresent:!!env.annual,webhookSecretPresent:!!env.webhook,supabaseAdminPresent:!!env.admin,unavailableReason};
}
export function billingAvailable(options:{logDiagnostics?:boolean}={}){const report=billingAvailability();if(options.logDiagnostics)console.info({billingAvailability:report});return report.unavailableReason===null;}

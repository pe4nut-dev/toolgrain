import 'server-only';
export function stripeConfig(){const secret=process.env.STRIPE_SECRET_KEY,monthly=process.env.STRIPE_PRO_MONTHLY_PRICE_ID,annual=process.env.STRIPE_PRO_ANNUAL_PRICE_ID;if(!secret||!/^sk_(test|live)_/.test(secret)||!monthly?.startsWith('price_')||!annual?.startsWith('price_')||monthly===annual)return null;return {secret,monthly,annual};}
export function billingAvailable(){return !!stripeConfig()&&!!process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')&&!!process.env.SUPABASE_SERVICE_ROLE_KEY;}

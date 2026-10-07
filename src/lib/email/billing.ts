import 'server-only';
import {createSupabaseAdmin} from '@/lib/supabase/admin';
import {proActivationEmail} from './pro-activation';
import {sendTransactionalEmail,smtpConfig,type TransactionalEmail,type EmailResult} from './server';
export type ActivationContext={userId:string;subscriptionId:string;stripeEventId:string;livemode:boolean;prices:{monthly:string;annual:string}};
export type EmailClaim={id:string;recipient_email:string|null;stripe_price_id:string;subscription_current_period_end:string|null};
export type EmailEventRepository={claim:(context:ActivationContext)=>Promise<EmailClaim|null>;finish:(id:string,result:EmailResult)=>Promise<void>};
export function emailEventRepository():EmailEventRepository{
 const db=createSupabaseAdmin();if(!db)throw new Error('Email database unavailable');
 return {
  async claim(context){const {data,error}=await db.rpc('claim_pro_activation_email',{p_user:context.userId,p_subscription:context.subscriptionId,p_event:context.stripeEventId,p_live:context.livemode});if(error)throw new Error('Email claim failed');return data?.[0] as EmailClaim??null;},
  async finish(id,result){const {error}=await db.from('billing_email_events').update({status:result.status,diagnostic_code:result.code,completed_at:new Date().toISOString()}).eq('id',id).eq('status','sending');if(error)throw new Error('Email status update failed');},
 };
}
function logEmail(context:ActivationContext,code:string){console.warn('Toolgrain billing email',{emailType:'pro_activation',userId:context.userId,stripeEventId:context.stripeEventId,subscriptionId:context.subscriptionId,livemode:context.livemode,code});}
export async function deliverProActivation(context:ActivationContext,dependencies?:{repository:EmailEventRepository;send:(email:TransactionalEmail)=>Promise<EmailResult>;configured:()=>boolean}){
 // Catch ALL email failures: successful billing/webhook state must not depend on delivery.
 try{
  if(!(dependencies?.configured??(()=>!!smtpConfig()))()){logEmail(context,'SMTP_UNAVAILABLE');return;}
  const repository=dependencies?.repository??emailEventRepository();const claim=await repository.claim(context);if(!claim)return;
  const email=proActivationEmail({priceId:claim.stripe_price_id,periodEnd:claim.subscription_current_period_end},context.prices);
  if(!email||!claim.recipient_email){const result:EmailResult={status:'failed',code:email?'ACCOUNT_EMAIL_UNAVAILABLE':'UNKNOWN_PRICE'};await repository.finish(claim.id,result);logEmail(context,result.code);return;}
  let result:EmailResult;
  try{result=await (dependencies?.send??sendTransactionalEmail)({...email,to:claim.recipient_email,messageId:'<toolgrain-pro-'+claim.id+'@toolgrain.com>'});}
  catch{result={status:'failed',code:'EMAIL_FAILURE'};}
  await repository.finish(claim.id,result);
  if(result.status!=='sent')logEmail(context,result.code);
  else if(!context.livemode)logEmail(context,'TEST_SUBSCRIPTION_EMAIL_SENT');
 }catch{logEmail(context,'EMAIL_INFRASTRUCTURE_FAILURE');}
}

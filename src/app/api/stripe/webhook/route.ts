import {deliverProActivation} from '@/lib/email/billing';
import {getStripe} from '@/lib/stripe/server';
import {stripeConfig} from '@/lib/stripe/config';
import {billingRepository} from '@/lib/stripe/repository';
import {processBillingEvent} from '@/lib/stripe/service';
export const runtime='nodejs';
export async function POST(request:Request){const stripe=getStripe(),config=stripeConfig(),secret=process.env.STRIPE_WEBHOOK_SECRET;if(!stripe||!config||!secret||!process.env.SUPABASE_SERVICE_ROLE_KEY)return new Response('Billing unavailable',{status:503});const signature=request.headers.get('stripe-signature');if(!signature)return new Response('Invalid signature',{status:400});const body=await request.text();let event;try{event=stripe.webhooks.constructEvent(body,signature,secret);}catch{return new Response('Invalid signature',{status:400});}try{await processBillingEvent(stripe,billingRepository(),event,config,deliverProActivation);return Response.json({received:true},{headers:{'Cache-Control':'no-store'}});}catch{console.error('Toolgrain billing webhook failed; Stripe may retry.');return new Response('Processing failed',{status:503});}}

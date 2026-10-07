import {afterEach,describe,expect,it,vi} from 'vitest';
import Stripe from 'stripe';
import {stripeConfig} from '../src/lib/stripe/config';
vi.mock('server-only',()=>({}));
afterEach(()=>vi.unstubAllEnvs());
describe('official Stripe SDK restricted-key authentication',()=>{
 it.each(['rk_test_fixture','rk_live_fixture'])('uses unchanged Bearer authentication for %s',async key=>{
  vi.stubEnv('STRIPE_SECRET_KEY',' '+key+' ');vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID','price_month');vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID','price_year');
  const transport=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify({id:'cus_fixture',object:'customer'}),{status:200,headers:{'content-type':'application/json'}}));
  const stripe=new Stripe(stripeConfig()!.secret,{httpClient:Stripe.createFetchHttpClient(transport),maxNetworkRetries:0});
  const customer=await stripe.customers.create({metadata:{supabase_user_id:'fixture-account'}});
  expect(customer.id).toBe('cus_fixture');expect(transport).toHaveBeenCalledTimes(1);
  const [url,init]=transport.mock.calls[0];expect(String(url)).toBe('https://api.stripe.com/v1/customers');expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer '+key);
 });
});

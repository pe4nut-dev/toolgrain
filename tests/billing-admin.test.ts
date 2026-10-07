import {afterEach,describe,expect,it,vi} from 'vitest';
import {createClient} from '@supabase/supabase-js';
import {createSupabaseAdmin} from '../src/lib/supabase/admin';
import {billingRepository} from '../src/lib/stripe/repository';
vi.mock('server-only',()=>({}));
vi.mock('next/headers',()=>({cookies:()=>{throw new Error('Admin must not read cookies');},headers:()=>{throw new Error('Admin must not read user headers');}}));
vi.mock('@supabase/ssr',()=>({createServerClient:()=>{throw new Error('Admin must not use SSR');}}));
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function setup(key='sb_secret_test_only'){
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://billing-test.supabase.co');
 vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY',key);
 const fetcher=vi.fn(async()=>new Response('true',{status:200,headers:{'content-type':'application/json'}}));
 vi.stubGlobal('fetch',fetcher);return fetcher;
}
describe('isolated billing admin transport',()=>{
 it('trims outer whitespace before selecting secret-key authentication headers',async()=>{const transport=setup();vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL',' https://billing-test.supabase.co ');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY',' \nsb_secret_test_only\r\n ');await createSupabaseAdmin()!.rpc('acquire_billing_lock',{});const call=transport.mock.calls[0] as unknown as [unknown,RequestInit];const headers=new Headers(call[1].headers);expect(headers.get('apikey')).toBe('sb_secret_test_only');expect(headers.has('authorization')).toBe(false);});
 it('reproduces the previous SDK opaque-secret Bearer fallback',async()=>{const transport=setup();const previous=createClient('https://billing-test.supabase.co','sb_secret_test_only',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});await previous.rpc('acquire_billing_lock',{});const call=transport.mock.calls[0] as unknown as [unknown,RequestInit];expect(new Headers(call[1].headers).get('authorization')).toBe('Bearer sb_secret_test_only');});
 it('uses secret only as apikey with no user Authorization or cookies',async()=>{const transport=setup();const admin=createSupabaseAdmin()!;await admin.rpc('acquire_billing_lock',{p_user:'account',p_token:'lease'});const init=transport.mock.calls[0] as unknown as [unknown,RequestInit];const headers=new Headers(init[1].headers);expect(headers.get('apikey')).toBe('sb_secret_test_only');expect(headers.has('authorization')).toBe(false);expect(headers.has('cookie')).toBe(false);expect(()=>admin.auth.getSession()).toThrow('accessToken');});
 it('creates separate admin instances rather than sharing auth state',()=>{setup();expect(createSupabaseAdmin()).not.toBe(createSupabaseAdmin());});
 it('returns null when privileged configuration is missing',()=>{setup();vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','');expect(createSupabaseAdmin()).toBeNull();});
 it('retains legacy service-role key compatibility without user JWT',async()=>{const transport=setup('legacy-service-role-test');await createSupabaseAdmin()!.rpc('acquire_billing_lock',{});const call=transport.mock.calls[0] as unknown as [unknown,RequestInit];expect(new Headers(call[1].headers).get('authorization')).toBe('Bearer legacy-service-role-test');});
 it('reports actual failed RPC status without upstream sensitive text',async()=>{setup();vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({code:'42501',message:'secret private user token',details:'cookie'}),{status:403,headers:{'content-type':'application/json'}})));await expect(billingRepository().lock('own')).rejects.toMatchObject({diagnostic:{stage:'billing.lock.acquire',supabaseCode:'42501',httpStatus:403}});});
 it('all privileged operations use isolated transport',async()=>{const transport=setup();const repo=billingRepository();await repo.lock('own');await repo.release('own','lease');await repo.link('own','lease','cus_test');await repo.write('own','lease','cus_test',{stripe_subscription_id:null,stripe_subscription_status:null,stripe_price_id:null,subscription_current_period_end:null,plan:'free'});await repo.profile('own');await repo.userForCustomer('cus_test');expect(transport).toHaveBeenCalledTimes(6);for(const call of transport.mock.calls as unknown as [unknown,RequestInit][]){const headers=new Headers(call[1].headers);expect(headers.get('apikey')).toBe('sb_secret_test_only');expect(headers.has('authorization')).toBe(false);expect(headers.has('cookie')).toBe(false);}});
});

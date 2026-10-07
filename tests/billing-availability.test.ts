import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {billingAvailability,billingAvailable,stripeConfig,stripeWebhookSecret} from '../src/lib/stripe/config';
import {getStripe} from '../src/lib/stripe/server';
vi.mock('server-only',()=>({}));
const valid={STRIPE_SECRET_KEY:'sk_live_fixture',STRIPE_PRO_MONTHLY_PRICE_ID:'price_MonthFixture',STRIPE_PRO_ANNUAL_PRICE_ID:'price_AnnualFixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_fixture'};
beforeEach(()=>{for(const [name,value]of Object.entries(valid))vi.stubEnv(name,value);});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
describe('billing availability configuration',()=>{
 it.each(['test','live'])('supports %s keys without test-mode guards',mode=>{vi.stubEnv('STRIPE_SECRET_KEY','sk_'+mode+'_fixture');expect(billingAvailability()).toMatchObject({stripeSecretMode:mode,unavailableReason:null});expect(billingAvailable()).toBe(true);expect(getStripe()).not.toBeNull();});
 it.each(['production','preview','development'])('does not reject live keys based on VERCEL_ENV=%s',env=>{vi.stubEnv('VERCEL_ENV',env);expect(billingAvailable()).toBe(true);});
 it.each([
  ['STRIPE_SECRET_KEY','missing_stripe_secret'],['STRIPE_PRO_MONTHLY_PRICE_ID','missing_monthly_price'],['STRIPE_PRO_ANNUAL_PRICE_ID','missing_annual_price'],['STRIPE_WEBHOOK_SECRET','missing_webhook_secret'],['SUPABASE_SERVICE_ROLE_KEY','missing_supabase_admin'],
 ])('identifies missing %s', (name,reason)=>{vi.stubEnv(name,'');expect(billingAvailability().unavailableReason).toBe(reason);expect(billingAvailable()).toBe(false);});
 it.each([
  ['STRIPE_SECRET_KEY','pk_live_fixture','invalid_stripe_secret_format'],['STRIPE_SECRET_KEY','rk_live_fixture','invalid_stripe_secret_format'],['STRIPE_SECRET_KEY','sk_live_','invalid_stripe_secret_format'],['STRIPE_PRO_MONTHLY_PRICE_ID','prod_fixture','invalid_monthly_price_format'],['STRIPE_PRO_ANNUAL_PRICE_ID','prod_fixture','invalid_annual_price_format'],['STRIPE_WEBHOOK_SECRET','sk_live_fixture','invalid_webhook_secret_format'],['STRIPE_WEBHOOK_SECRET','whsec_','invalid_webhook_secret_format'],
 ])('rejects incorrect format for %s', (name,value,reason)=>{vi.stubEnv(name,value);expect(billingAvailability().unavailableReason).toBe(reason);});
 it('unknown secret type reports unknown mode without disclosing its value',()=>{vi.stubEnv('STRIPE_SECRET_KEY','private arbitrary token');expect(billingAvailability()).toMatchObject({stripeSecretMode:'unknown',unavailableReason:'invalid_stripe_secret_format'});});
 it('rejects identical normalized price IDs',()=>{vi.stubEnv('STRIPE_PRO_ANNUAL_PRICE_ID',' '+valid.STRIPE_PRO_MONTHLY_PRICE_ID+' ');expect(billingAvailability().unavailableReason).toBe('identical_price_ids');});
 it('normalizes outer whitespace consistently for actual Stripe calls and signature verification',()=>{for(const [name,value]of Object.entries(valid))vi.stubEnv(name,' \n'+value+'\r\n ');expect(billingAvailable()).toBe(true);expect(stripeConfig()).toEqual({secret:valid.STRIPE_SECRET_KEY,monthly:valid.STRIPE_PRO_MONTHLY_PRICE_ID,annual:valid.STRIPE_PRO_ANNUAL_PRICE_ID});expect(stripeWebhookSecret()).toBe(valid.STRIPE_WEBHOOK_SECRET);});
 it.each([
  ['STRIPE_SECRET_KEY','sk_live_bad key','invalid_stripe_secret_format'],['STRIPE_PRO_MONTHLY_PRICE_ID','price_bad\nkey','invalid_monthly_price_format'],['STRIPE_PRO_ANNUAL_PRICE_ID','price_bad key','invalid_annual_price_format'],['STRIPE_WEBHOOK_SECRET','whsec_bad key','invalid_webhook_secret_format'],['SUPABASE_SERVICE_ROLE_KEY','sb_secret_bad key','invalid_supabase_admin_format'],
 ])('rejects internal whitespace in %s', (name,value,reason)=>{vi.stubEnv(name,value);expect(billingAvailability().unavailableReason).toBe(reason);});
 it('SMTP configuration cannot disable billing',()=>{for(const name of ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASSWORD','SMTP_FROM_EMAIL','SMTP_FROM_NAME'])vi.stubEnv(name,'');expect(billingAvailable()).toBe(true);});
 it('missing webhook secret keeps checkout unavailable although Stripe client can initialize',()=>{vi.stubEnv('STRIPE_WEBHOOK_SECRET','');expect(getStripe()).not.toBeNull();expect(billingAvailable()).toBe(false);});
 it('whitespace-only values are absent',()=>{vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY',' \n ');expect(billingAvailability()).toMatchObject({supabaseAdminPresent:false,unavailableReason:'missing_supabase_admin'});});
 it('logs only the requested safe diagnostic fields and never actual values',()=>{const info=vi.spyOn(console,'info').mockImplementation(()=>{});expect(billingAvailable({logDiagnostics:true})).toBe(true);expect(info).toHaveBeenCalledWith({billingAvailability:{stripeSecretPresent:true,stripeSecretMode:'live',monthlyPricePresent:true,annualPricePresent:true,webhookSecretPresent:true,supabaseAdminPresent:true,unavailableReason:null}});const output=JSON.stringify(info.mock.calls);for(const value of Object.values(valid))expect(output).not.toContain(value);});
 it('does not log configuration outside the explicit diagnostics path',()=>{const info=vi.spyOn(console,'info').mockImplementation(()=>{});billingAvailability();stripeConfig();billingAvailable();expect(info).not.toHaveBeenCalled();});
 it('uses current runtime environment on every call rather than cached deployment state',()=>{expect(billingAvailable()).toBe(true);vi.stubEnv('STRIPE_WEBHOOK_SECRET','');expect(billingAvailable()).toBe(false);vi.stubEnv('STRIPE_WEBHOOK_SECRET',valid.STRIPE_WEBHOOK_SECRET);expect(billingAvailable()).toBe(true);});
});

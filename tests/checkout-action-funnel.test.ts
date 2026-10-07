import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({account:vi.fn(),start:vi.fn(),redirect:vi.fn((url:string)=>{throw Error('redirect:'+url);})}));
vi.mock('server-only',()=>({}));
vi.mock('next/navigation',()=>({redirect:mocks.redirect}));
vi.mock('../src/lib/auth/account',()=>({getAccount:mocks.account}));
vi.mock('../src/lib/stripe/server',()=>({getStripe:()=>({})}));
vi.mock('../src/lib/stripe/config',()=>({billingAvailable:()=>true,stripeConfig:()=>({monthly:'price_monthly',annual:'price_annual'})}));
vi.mock('../src/lib/stripe/repository',()=>({billingRepository:()=>({})}));
vi.mock('../src/lib/stripe/service',()=>({startCheckout:mocks.start,startPortal:vi.fn()}));
vi.mock('../src/lib/stripe/diagnostics',()=>({logBillingFailure:vi.fn()}));
import {checkoutAction} from '../src/app/billing/actions';
beforeEach(()=>{vi.clearAllMocks();mocks.account.mockResolvedValue({user:{id:'private-user'},plan:'free'});});
describe('server checkout result boundary',()=>{
 it('returns only a confirmed hosted Checkout URL for browser navigation',async()=>{
  mocks.start.mockResolvedValue({url:'https://checkout.stripe.com/c/pay/cs_private'});
  expect(await checkoutAction({},new FormData())).toEqual({checkoutUrl:'https://checkout.stripe.com/c/pay/cs_private'});
  expect(mocks.redirect).not.toHaveBeenCalled();
 });
 it('a failed creation returns an error without a checkout URL',async()=>{
  mocks.start.mockResolvedValue({error:'Unavailable'});expect(await checkoutAction({},new FormData())).toEqual({error:'Unavailable'});
 });
 it('a thrown billing failure cannot produce a checkout URL',async()=>{
  mocks.start.mockRejectedValue(Error('private failure'));expect(await checkoutAction({},new FormData())).toEqual({error:'Checkout could not be started. Please try again shortly.'});
 });
 it('existing Pro/account redirects retain the original server behavior',async()=>{
  mocks.start.mockResolvedValue({url:'/account?billing=pending'});await expect(checkoutAction({},new FormData())).rejects.toThrow('redirect:/account?billing=pending');
 });
 it('anonymous users are redirected before checkout',async()=>{
  mocks.account.mockResolvedValue({user:null,plan:'free'});await expect(checkoutAction({},new FormData())).rejects.toThrow('redirect:/login?next=%2Fpricing');expect(mocks.start).not.toHaveBeenCalled();
 });
});

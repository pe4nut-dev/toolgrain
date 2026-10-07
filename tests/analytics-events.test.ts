import {afterEach,describe,expect,it,vi} from 'vitest';
import {sanitizeToolgrainEvent,trackToolgrainEvent,type ToolgrainEvent,type EventProperties} from '../src/lib/analytics-events';
import {createUmamiPrivacyFilter} from '../src/lib/umami';
import {analyticsPublicPaths} from '../src/lib/analytics';
import {continueToCheckout} from '../src/lib/checkout-navigation';
const events:ToolgrainEvent[]=['tool_started','tool_completed','export_clicked','upgrade_clicked','checkout_started'];
afterEach(()=>vi.unstubAllGlobals());
describe('anonymous conversion allowlist',()=>{
 it.each(events)('accepts %s',event=>expect(sanitizeToolgrainEvent(event,{plan:'free'})).toEqual({name:event,data:{plan:'free'}}));
 it.each(['crm-cleaner','csv-compare','supplier-shopify'])('accepts tool %s',tool=>expect(sanitizeToolgrainEvent('tool_started',{tool,plan:'pro'})).toEqual({name:'tool_started',data:{tool,plan:'pro'}}));
 it.each(['free','pro'])('accepts plan %s',plan=>expect(sanitizeToolgrainEvent('upgrade_clicked',{plan})?.data).toEqual({plan}));
 it.each([['unknown',{}],['tool_started',{tool:'filename.csv'}],['tool_started',{plan:'enterprise'}],['tool_started',null],['tool_started',[]]])('rejects invalid name/value %j', (event,data)=>expect(sanitizeToolgrainEvent(event,data)).toBeNull());
 it('drops every property other than tool/plan at both boundaries',()=>{
  const data={tool:'crm-cleaner',plan:'free',email:'secret',filename:'private.csv',headers:['email'],rows:['private'],userId:'user',stripeId:'cus_private',company:'private'};
  const track=vi.fn();vi.stubGlobal('window',{umami:{track}});
  trackToolgrainEvent('tool_started',data as EventProperties);
  expect(track).toHaveBeenCalledExactlyOnceWith('tool_started',{tool:'crm-cleaner',plan:'free'});
  const filter=createUmamiPrivacyFilter(analyticsPublicPaths,'site');
  const payload=filter('event',{name:'tool_started',data,hostname:'toolgrain.com',url:'/tools?email=private#private.csv',id:undefined,title:'secret',email:'secret'});
  expect(payload).toMatchObject({name:'tool_started',data:{tool:'crm-cleaner',plan:'free'},url:'/tools',title:'Toolgrain'});
  expect(JSON.stringify(payload)).not.toMatch(/secret|private|filename|headers|rows|userId|stripeId|company/);
 });
 it('does nothing on the server or when the tracker is unavailable',()=>{
  expect(()=>trackToolgrainEvent('tool_started',{plan:'free'})).not.toThrow();
  vi.stubGlobal('window',{});expect(()=>trackToolgrainEvent('tool_started')).not.toThrow();
 });
 it('never calls the browser tracker for invalid runtime inputs',()=>{
  const track=vi.fn();vi.stubGlobal('window',{umami:{track}});
  trackToolgrainEvent('unknown' as ToolgrainEvent,{plan:'free'});
  trackToolgrainEvent('tool_started',{tool:'private.csv'} as unknown as EventProperties);
  trackToolgrainEvent('tool_started',{plan:'enterprise'} as unknown as EventProperties);
  expect(track).not.toHaveBeenCalled();
 });
 it('swallows synchronous and asynchronous tracker failures',async()=>{
  vi.stubGlobal('window',{umami:{track:()=>{throw Error('blocked');}}});expect(()=>trackToolgrainEvent('tool_started')).not.toThrow();
  vi.stubGlobal('window',{umami:{track:()=>Promise.reject(Error('blocked'))}});trackToolgrainEvent('tool_started');await Promise.resolve();
 });
 it('rejects unknown events and identity in the tracker guard',()=>{
  const filter=createUmamiPrivacyFilter(analyticsPublicPaths,'site');
  const base={hostname:'toolgrain.com',url:'/tools',data:{plan:'free'}};
  for(const extra of [{name:'unknown'},{name:'tool_started',data:{tool:'private'}},{name:'tool_started',data:{plan:'private'}},{name:'tool_started',id:'user'}])expect(filter('event',{...base,...extra})).toBe(false);
 });
 it('permits an account upgrade action but never an account pageview',()=>{
  const filter=createUmamiPrivacyFilter(analyticsPublicPaths,'site');
  const base={hostname:'toolgrain.com',url:'/account?checkout=secret'};
  expect(filter('event',base)).toBe(false);
  expect(filter('event',{...base,name:'upgrade_clicked',data:{plan:'free'}})).toMatchObject({url:'/account',name:'upgrade_clicked',data:{plan:'free'}});
 });
});
describe('checkout navigation boundary',()=>{
 it('tracks only confirmed checkout success, before navigation, without the URL/IDs',()=>{
  const sequence:string[]=[];const track=vi.fn(()=>sequence.push('event'));vi.stubGlobal('window',{umami:{track}});
  const navigate=vi.fn(()=>sequence.push('navigate'));
  continueToCheckout({checkoutUrl:'https://checkout.stripe.com/c/pay/cs_private'},navigate);
  expect(sequence).toEqual(['event','navigate']);expect(track).toHaveBeenCalledExactlyOnceWith('checkout_started',{plan:'free'});
  expect(navigate).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_private');
 });
 it('does not fire for failure, internal redirects or arbitrary URLs',()=>{
  const track=vi.fn(),navigate=vi.fn();vi.stubGlobal('window',{umami:{track}});
  for(const checkoutUrl of [undefined,'/account','/account?billing=pending','https://evil.com/checkout'])continueToCheckout({checkoutUrl},navigate);
  expect(track).not.toHaveBeenCalled();expect(navigate).not.toHaveBeenCalled();
 });
 it('navigation continues even when analytics throws',()=>{
  vi.stubGlobal('window',{umami:{track:()=>{throw Error('blocked');}}});const navigate=vi.fn();
  continueToCheckout({checkoutUrl:'https://checkout.stripe.com/test'},navigate);expect(navigate).toHaveBeenCalledOnce();
 });
});

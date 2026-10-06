import {describe,it,expect} from 'vitest';
import {filterAnalyticsEvent} from '../src/lib/analytics';
describe('analytics privacy filter',()=>{
 it('removes query strings, tokens and fragments',()=>expect(filterAnalyticsEvent({type:'pageview',url:'https://toolgrain.com/tools?email=private&token=secret#csv'})).toEqual({type:'pageview',url:'https://toolgrain.com/tools'}));
 it.each(['/login','/signup','/account','/auth/callback','/unknown/private'])('excludes %s',path=>expect(filterAnalyticsEvent({type:'pageview',url:'https://toolgrain.com'+path})).toBeNull());
 it('excludes custom events',()=>expect(filterAnalyticsEvent({type:'event',url:'https://toolgrain.com/tools'})).toBeNull());
 it('rejects malformed URLs',()=>expect(filterAnalyticsEvent({type:'pageview',url:'invalid'})).toBeNull());
 it('includes tool pages',()=>expect(filterAnalyticsEvent({type:'pageview',url:'https://toolgrain.com/tools/crm-csv-cleaner'})?.url).toBe('https://toolgrain.com/tools/crm-csv-cleaner'));
});

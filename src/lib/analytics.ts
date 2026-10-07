import type {BeforeSendEvent} from '@vercel/analytics/next';
import {tools} from '@/lib/tools';
export const analyticsPublicPaths=['/', '/tools', '/pricing', '/about', '/privacy', '/imprint', ...tools.map(tool=>'/tools/'+tool.slug)];
const publicPaths=new Set(analyticsPublicPaths);
// Never send auth URLs, arbitrary paths, query parameters, hashes or custom payloads.
export function filterAnalyticsEvent(event:BeforeSendEvent):BeforeSendEvent|null {
 if(event.type!=='pageview')return null;
 try {const url=new URL(event.url);if(!publicPaths.has(url.pathname))return null;return {type:'pageview',url:url.origin+url.pathname};}catch{return null;}
}

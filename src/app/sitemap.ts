import type { MetadataRoute } from 'next';
import { siteConfig } from '../config/site';
import { tools } from '../lib/tools';
export default function sitemap():MetadataRoute.Sitemap {
 const entries: {path:string;priority:number;changeFrequency:'weekly'|'monthly'|'yearly'}[]=[
 {path:'/',priority:1,changeFrequency:'weekly'}, {path:'/tools',priority:.9,changeFrequency:'weekly'},
 ...tools.filter(tool=>tool.status!=='coming-soon').map(tool=>({path:'/tools/'+tool.slug,priority:.9,changeFrequency:'weekly' as const})),
 {path:'/pricing',priority:.7,changeFrequency:'monthly'}, {path:'/about',priority:.6,changeFrequency:'monthly'}, {path:'/privacy',priority:.3,changeFrequency:'yearly'}, {path:'/imprint',priority:.3,changeFrequency:'yearly'}];
 return entries.map(({path,...entry})=>({url:new URL(path,siteConfig.url).toString(),...entry}));
}

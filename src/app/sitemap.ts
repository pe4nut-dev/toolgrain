import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { tools } from '@/lib/tools';
export default function sitemap():MetadataRoute.Sitemap {
 const paths=['/','/tools',...tools.filter(tool=>tool.status!=='coming-soon').map(tool=>'/tools/'+tool.slug),'/about','/privacy','/imprint'];
 return paths.map(path=>({url:new URL(path,siteConfig.url).toString()}));
}

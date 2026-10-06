import type { Metadata } from 'next';
import { siteConfig } from './site';
/** Every route owns its canonical and OG URL; no homepage URL leaks into subpages. */
export function pageMetadata(title:string,description:string,path:string,index=true):Metadata {
  const url=new URL(path,siteConfig.url).toString();
  return {
    title, description,
    alternates:{canonical:url},
    openGraph:{type:'website',siteName:siteConfig.name,title:title+' – '+siteConfig.name,description,url},
    robots:{index,follow:true},
  };
}

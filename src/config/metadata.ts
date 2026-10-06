import type { Metadata } from 'next';
import { siteConfig } from './site';
/** Every route owns its canonical and OG URL. */
export function pageMetadata(title:string,description:string,path:string,index=true):Metadata {
 const url=new URL(path,siteConfig.url).toString();
 const fullTitle=title.includes('Toolgrain')?title:title+' – '+siteConfig.name;
 return {title:{absolute:fullTitle},description,alternates:{canonical:url},openGraph:{type:'website',locale:'en_US',siteName:siteConfig.name,title:fullTitle,description,url},robots:{index,follow:true}};
}

import {describe,it,expect} from 'vitest';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import { pageMetadata } from '../src/config/metadata';
import { tools } from '../src/lib/tools';
import { faqStructuredData,serializeStructuredData } from '../src/components/seo/json-ld';
describe('SEO discovery and structured data',()=>{
 it('includes the eight public pages with production URLs and priorities',()=>{const entries=sitemap();expect(entries.map(e=>e.url)).toEqual(['https://toolgrain.com/','https://toolgrain.com/tools','https://toolgrain.com/tools/crm-csv-cleaner','https://toolgrain.com/tools/csv-compare','https://toolgrain.com/tools/supplier-csv-to-shopify','https://toolgrain.com/about','https://toolgrain.com/privacy','https://toolgrain.com/imprint']);expect(entries.map(e=>e.priority)).toEqual([1,.9,.9,.9,.9,.6,.3,.3]);});
 it('excludes every coming-soon tool from sitemap',()=>{for(const t of tools.filter(t=>t.status==='coming-soon'))expect(sitemap().some(e=>e.url.endsWith('/'+t.slug))).toBe(false);});
 it('allows crawling and references canonical sitemap',()=>expect(robots()).toEqual({rules:{userAgent:'*',allow:'/'},sitemap:'https://toolgrain.com/sitemap.xml'}));
 it('uses matching canonical and Open Graph URLs with a single brand title',()=>{const m=pageMetadata('Privacy Policy | Toolgrain','Privacy details','/privacy');expect(m.alternates?.canonical).toBe('https://toolgrain.com/privacy');expect(m.openGraph).toMatchObject({url:'https://toolgrain.com/privacy',locale:'en_US',title:'Privacy Policy | Toolgrain'});expect(m.title).toEqual({absolute:'Privacy Policy | Toolgrain'});});
 it.each(tools.filter(t=>t.status==='available'))('FAQ schema mirrors visible registry content for $slug',tool=>{const data=faqStructuredData(tool.faqs);expect(data).toMatchObject({'@type':'FAQPage',mainEntity:tool.faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))});expect(tool.seo?.relatedSlug).toBeTruthy();expect(tools.some(t=>t.slug===tool.seo?.relatedSlug)).toBe(true);});
 it('escapes script-closing text without changing structured data',()=>{const data=faqStructuredData([{question:'</script><script>alert(1)</script>',answer:'Safe & visible'}]);const encoded=serializeStructuredData(data);expect(encoded).not.toContain('<');expect(JSON.parse(encoded)).toEqual(data);});
});

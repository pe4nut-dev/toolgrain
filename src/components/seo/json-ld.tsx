type Faq = {question:string;answer:string};
export type StructuredData = { '@context':'https://schema.org'; '@type':'WebSite';name:string;url:string;description:string } | { '@context':'https://schema.org'; '@type':'FAQPage';mainEntity:{'@type':'Question';name:string;acceptedAnswer:{'@type':'Answer';text:string}}[] };
export function faqStructuredData(faqs:readonly Faq[]):StructuredData {return {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(faq=>({'@type':'Question',name:faq.question,acceptedAnswer:{'@type':'Answer',text:faq.answer}}))};}
export function serializeStructuredData(data:StructuredData):string{return JSON.stringify(data).replace(/</g,'\\u003c');}
export function JsonLd({data}:{data:StructuredData}){return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeStructuredData(data)}}/>;}

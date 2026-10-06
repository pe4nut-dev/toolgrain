'use client';
import {useId} from 'react';
import {usePathname} from 'next/navigation';
import {MessageSquare} from 'lucide-react';
import {feedbackConfig} from '@/config/feedback';
import {getTool} from '@/lib/tools';
import {createFeedbackContext,type FeedbackInput} from '@/lib/feedback/context';
import {createFeedbackMailto} from '@/lib/feedback/mailto';
import {Container} from '@/components/ui/shared';
type Props=FeedbackInput & {title?:string;description?:string};
export function FeedbackCTA({pagePath,pageTitle,toolName,context,title,description}:Props){
 const headingId=useId();
 return <Container><section className="feedback-cta" aria-labelledby={headingId}><div><h2 id={headingId}>{title??('Help make '+(toolName??'Toolgrain')+' better.')}</h2><p>{description??'Found a problem or have an idea? Send us your feedback.'}</p><p className="feedback-hint">Opens your email app with a ticket reference and this page. You review and send the email.</p></div><a className="button secondary" href={'mailto:'+feedbackConfig.email} onClick={event=>{event.currentTarget.href=createFeedbackMailto(createFeedbackContext({pagePath,pageTitle,toolName,context}));}}><MessageSquare size={17} aria-hidden="true"/>Send feedback</a></section></Container>;
}
const pageNames:Record<string,string>={'/':'Toolgrain','/tools':'Tool directory','/about':'About Toolgrain','/pricing':'Pricing','/privacy':'Privacy Policy','/imprint':'Legal Notice'};
export function SiteFeedbackCTA(){const path=usePathname();const tool=path.startsWith('/tools/')?getTool(path.slice('/tools/'.length)):undefined;return <FeedbackCTA pagePath={path} toolName={tool?.name} pageTitle={tool?.name??pageNames[path]??'Toolgrain'}/>;}

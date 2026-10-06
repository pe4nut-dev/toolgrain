import {feedbackConfig} from '../../config/feedback';
import {generateTicketReference} from './generate-ticket-reference';
export type FeedbackInput={pagePath:string;pageTitle?:string;toolName?:string;context?:string};
export type FeedbackContext={ticketReference:string;pageTitle:string;pagePath:string;pageUrl:string;toolName?:string;context?:string};
export function createFeedbackContext(input:FeedbackInput):FeedbackContext {
 const path=input.pagePath.split(/[?#]/)[0];
 const candidate=new URL(path.startsWith('/')&&!path.startsWith('//')&&!path.includes('\\')?path:'/',feedbackConfig.baseUrl);
 const pagePath=candidate.pathname;
 return {ticketReference:generateTicketReference(),pageTitle:input.pageTitle||input.toolName||'Toolgrain',pagePath,pageUrl:new URL(pagePath,feedbackConfig.baseUrl).href,...(input.toolName?{toolName:input.toolName}:{}),...(input.context?{context:input.context}:{})};
}

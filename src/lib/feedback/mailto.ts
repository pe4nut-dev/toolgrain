import {feedbackConfig} from '../../config/feedback';
import type {FeedbackContext} from './context';
export function createFeedbackMailto(context:FeedbackContext):string {
 const subject='['+context.ticketReference+'] Feedback – '+context.pageTitle;
 const body=['Ticket reference: '+context.ticketReference,'Page: '+context.pageUrl,...(context.toolName?['Tool: '+context.toolName]:[]),...(context.context?['Context: '+context.context]:[]),'','Feedback:','[Write your feedback here]','','Please do not include sensitive data or CSV contents.'].join('\n');
 return 'mailto:'+feedbackConfig.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}

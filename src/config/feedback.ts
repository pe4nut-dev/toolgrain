import {siteConfig} from './site';
export const feedbackConfig={email:siteConfig.contactEmail,baseUrl:siteConfig.url,ticketPrefix:'TG'} as const;

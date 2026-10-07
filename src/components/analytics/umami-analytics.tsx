import React from 'react';
import Script from 'next/script';
import {analyticsPublicPaths} from '@/lib/analytics';
import {createUmamiPrivacyFilter} from '@/lib/umami';
import {sanitizeToolgrainEvent} from '@/lib/analytics-events';
const websiteId='bab65517-c03d-496f-b6e5-4891619fe213';
export function getUmamiPrivacyGuard(){
 const guard='window.toolgrainUmamiBeforeSend=('+createUmamiPrivacyFilter.toString()+')('+JSON.stringify(analyticsPublicPaths)+','+JSON.stringify(websiteId)+',('+sanitizeToolgrainEvent.toString()+'));';
 return guard.replace(/</g,'\\u003c');
}
export function UmamiAnalytics(){
 return <>
  <Script id="toolgrain-umami" src="https://cloud.umami.is/script.js" strategy="afterInteractive" data-website-id={websiteId} data-exclude-search="true" data-exclude-hash="true" data-before-send="toolgrainUmamiBeforeSend" referrerPolicy="no-referrer"/>
 </>;
}

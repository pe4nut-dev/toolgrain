import {Manrope} from 'next/font/google';
const manrope=Manrope({subsets:['latin'],weight:'800',display:'swap',variable:'--font-brand'});
import {SiteAnalytics} from '@/components/analytics/site-analytics';
import type { Metadata } from 'next';
import './globals.css';
import {getAccount} from '@/lib/auth/account';
import {AccountProvider} from '@/components/auth/account-provider';
export const dynamic='force-dynamic';
import { siteConfig } from '@/config/site';
import { Header } from '@/components/layout/header';
import { SiteFeedbackCTA } from '@/components/layout/feedback-cta';
import { Footer } from '@/components/layout/footer';
export const metadata: Metadata = {
 applicationName:siteConfig.name,
 metadataBase:new URL(siteConfig.url),
 title:{default:siteConfig.name+' – '+siteConfig.tagline.replace(/\.$/,''),template:'%s – '+siteConfig.name},
 description:siteConfig.description,
 alternates:{canonical:siteConfig.url},
 openGraph:{locale:'en_US',type:'website',siteName:siteConfig.name,title:siteConfig.name+' – '+siteConfig.tagline.replace(/\.$/,''),description:siteConfig.description,url:siteConfig.url},
 robots:{index:true,follow:true},
};
export default async function RootLayout({ children }: {
    children: React.ReactNode;
}) { const account=await getAccount();return <html lang="en" className={manrope.variable}><body><a className="skip-link" href="#main">Skip to content</a><AccountProvider plan={account.plan} signedIn={!!account.user}><Header /><main id="main">{children}<SiteFeedbackCTA /></main><Footer /></AccountProvider><SiteAnalytics /></body></html>; }

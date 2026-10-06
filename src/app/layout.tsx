import type { Metadata } from 'next';
import './globals.css';
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
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}<SiteFeedbackCTA /></main><Footer /></body></html>; }

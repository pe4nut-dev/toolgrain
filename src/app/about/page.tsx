import Link from 'next/link';
import { ArrowRight, Focus, Zap, ShieldCheck, Sprout } from 'lucide-react';
import { pageMetadata } from '@/config/metadata';
import { siteConfig } from '@/config/site';

import { Container, ButtonLink } from '@/components/ui/shared';

const aboutTitle = 'About Toolgrain – Simple tools for annoying business tasks';
export const metadata = {
  ...pageMetadata(aboutTitle, 'Learn why Toolgrain builds small, focused tools instead of complicated business software.', '/about'),
  title: { absolute: aboutTitle },
};

export default function About() {
  return <Container className="page-section prose-page">
    <p className="eyebrow">WHY TOOLGRAIN</p>
    <h1 className="page-title">Software doesn’t have to be complicated.</h1>
    <p className="page-description">Toolgrain provides three focused CSV tools: clean CRM contacts, compare CSV files and prepare supplier product data for Shopify. Each tool handles one task, with CSV processing local to your browser.</p>

    <section className="section about-principles">
      <div className="about-usp"><div className="about-usp-marker" aria-hidden="true"><Focus size={34} strokeWidth={1.6} /></div><div className="about-usp-copy"><h2>One tool. One task.</h2>
      <p>Toolgrain tools are deliberately narrow. Each one focuses on a specific job and aims to do it well, without turning a small problem into another platform, dashboard or workflow.</p></div></div>
      <div className="about-usp"><div className="about-usp-marker" aria-hidden="true"><Zap size={34} strokeWidth={1.6} /></div><div className="about-usp-copy"><h2>Useful in minutes, not after onboarding.</h2>
      <p>A clear input-to-result workflow should make basic use straightforward, without training or unnecessary dashboards. We keep setup to what the task actually needs, so you can get started quickly.</p></div></div>
      <div className="about-usp"><div className="about-usp-marker" aria-hidden="true"><ShieldCheck size={34} strokeWidth={1.6} /></div><div className="about-usp-copy"><h2>Your data stays closer to you.</h2>
      <p>CRM CSV Cleaner, CSV Compare and Supplier CSV to Shopify process CSV contents locally in your browser. Selected files and tool results are not uploaded to Toolgrain. Website hosting still involves ordinary technical request data.</p>
      <Link className="text-link" href="/privacy">Read how we handle data <ArrowRight size={17} aria-hidden="true" /></Link></div></div>
      <div className="about-usp"><div className="about-usp-marker" aria-hidden="true"><Sprout size={34} strokeWidth={1.6} /></div><div className="about-usp-copy"><h2>Built to grow one useful tool at a time.</h2>
      <p>New tools are added when they solve a recurring problem. The current tools focus on contact CSV cleanup, CSV comparison and Shopify product preparation.</p></div></div>

    </section>

    <section className="section">
      <h2>{siteConfig.brandLine}</h2>
      <p>If a tool needs a manual before it becomes useful, we probably made it too complicated.</p>
    </section>
    <section className="section">
      <h2>Three tools for everyday CSV tasks</h2>
      <p><Link className="text-link" href="/tools/crm-csv-cleaner">CRM CSV Cleaner</Link> Review duplicate contacts, invalid emails, formatting issues and missing values before exporting.</p><p><Link className="text-link" href="/tools/csv-compare">CSV Compare</Link> Compare two CSV files by key and inspect added, removed and changed rows.</p><p><Link className="text-link" href="/tools/supplier-csv-to-shopify">Supplier CSV to Shopify</Link> Map supplier columns, review validation issues and prepare new simple products for Shopify import.</p>
      <ButtonLink href="/tools/crm-csv-cleaner">Try CRM CSV Cleaner</ButtonLink>
    </section>
    <section>
      <h2>Help shape what comes next.</h2>
      <p>Toolgrain is still growing. If a tool saves you time, breaks on your file, or leaves out something important, we want to hear about it.</p>
      <a className="text-link" href={'mailto:' + siteConfig.contactEmail}>Send feedback <ArrowRight size={17} aria-hidden="true" /></a>
    </section>
  </Container>;
}

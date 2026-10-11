import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import type { Metadata } from 'next';

// Isolate marketing rendering from interactive tools and external billing services.
vi.mock('../src/components/tools/tool-workspace', () => ({ ToolWorkspace: () => null }));
vi.mock('../src/components/pricing/billing-buttons', () => ({ BillingButtons: () => null }));
import Home, { metadata as homeMetadata } from '../src/app/page';
import Directory, { metadata as directoryMetadata } from '../src/app/tools/page';
import ToolPage, { generateMetadata } from '../src/app/tools/[slug]/page';
import About from '../src/app/about/page';
import { PricingContent } from '../src/components/pricing/pricing-content';
import { tools, getTool } from '../src/lib/tools';
import { plans, planTools, type PlanToolId } from '../src/config/plans';
import { formatFileSize } from '../src/lib/files';
import sitemap from '../src/app/sitemap';

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());
const available = tools.filter(tool => tool.status === 'available');
const number = new Intl.NumberFormat('en');
const text = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
function assertMetadata(metadata: Metadata, title: string, description: string, path: string) {
  expect(metadata.title).toEqual({ absolute: title });
  expect(metadata.description).toBe(description);
  expect(metadata.alternates?.canonical).toBe('https://toolgrain.com' + path);
  expect(metadata.openGraph).toMatchObject({ title, description, url: 'https://toolgrain.com' + path });
  expect(metadata.robots).toEqual({ index: true, follow: true });
}

describe('on-page SEO and public metadata', () => {
  it('targets CSV tasks on the homepage without changing its canonical', () => {
    assertMetadata(homeMetadata, 'Online CSV Tools for Cleaning, Comparing & Shopify | Toolgrain', 'Clean CRM contacts, compare two CSV files by key and prepare supplier data for Shopify. Try browser-based CSV tools with local file processing.', '/');
  });
  it('targets available CSV tools in directory metadata', () => {
    assertMetadata(directoryMetadata, 'Online CSV Tools: Cleaner, Compare & Shopify Converter | Toolgrain', 'Explore CRM CSV Cleaner, CSV Compare and Supplier CSV to Shopify. Review and export CSV data locally in your browser, with Free and Pro limits.', '/tools');
  });
  it.each([
    ['crm-csv-cleaner', 'CRM CSV Cleaner – Review Duplicate Contacts Online | Toolgrain', 'Clean contact CSV files, review duplicate CRM contacts and flag invalid emails or missing values. Apply safe fixes and export locally in your browser.'],
    ['csv-compare', 'Compare Two CSV Files Online by Key | Toolgrain', 'Compare two CSV files by a selected key. Find added, removed and changed rows, review old and new values, and export CSV diff reports locally.'],
    ['supplier-csv-to-shopify', 'Supplier CSV to Shopify Converter | Toolgrain', 'Convert supplier CSV files for Shopify product import. Map columns, fix validation issues and export locally. For new simple products; no variants.'],
  ])('generates accurate metadata for %s', async (slug, title, description) => {
    assertMetadata(await generateMetadata({ params: Promise.resolve({ slug }) }), title, description, '/tools/' + slug);
  });
  it('retains noindex for coming-soon and unknown tools', async () => {
    for (const slug of [...tools.filter(tool => tool.status === 'coming-soon').map(tool => tool.slug), 'unknown-tool']) {
      expect((await generateMetadata({ params: Promise.resolve({ slug }) })).robots).toEqual({ index: false, follow: true });
    }
  });
  it.each(['login', 'signup', 'account'])('keeps the existing %s noindex declaration', route => {
    const source = readFileSync(new URL('../src/app/' + route + '/page.tsx', import.meta.url), 'utf8');
    expect(source).toMatch(new RegExp("pageMetadata\\([^;]*'\\/" + route + "',false\\)"));
    expect(sitemap().some(entry => entry.url === 'https://toolgrain.com/' + route)).toBe(false);
  });
  it('renders the directory H1, a section H2 before card H3s, and all available links on the server', async () => {
    const html = renderToStaticMarkup(await Directory({ searchParams: Promise.resolve({}) }));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('>Online CSV Tools</h1>');
    const h2 = html.indexOf('<h2 class="sr-only">Available and upcoming tools</h2>');
    expect(h2).toBeGreaterThan(-1); expect(h2).toBeLessThan(html.indexOf('<h3>'));
    for (const tool of available) expect(html).toContain('href="/tools/' + tool.slug + '"');
    expect(html).not.toContain('Loading tool directory');
  });
  it('describes current homepage capabilities and marks unavailable categories as coming soon', () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(text(html)).toContain('Clean CRM contacts, compare CSV files and prepare supplier product data for Shopify.');
    expect(html).toContain('Marketing</strong><span>Coming soon</span>');
    expect(html).toContain('Documents</strong><span>Coming soon</span>');
    expect(html).not.toContain('Future tools will explain');
    for (const tool of available) expect(html).toContain('href="/tools/' + tool.slug + '"');
  });
  it.each(available)('renders plan-derived limits and matching visible/structured FAQ answers for $slug', async tool => {
    const slug = tool.slug as PlanToolId;
    const html = renderToStaticMarkup(await ToolPage({ params: Promise.resolve({ slug }) }));
    const faq = tool.faqs.find(faq => /files are supported/.test(faq.question))!;
    for (const plan of ['free', 'pro'] as const) {
      expect(faq.answer).toContain(number.format(plans[plan].limits[slug]) + ' ' + planTools[slug].limitUnit);
      expect(faq.answer).toContain(formatFileSize(plans[plan].fileSizeBytes) + ' per file');
    }
    expect(tool.faqs.some(faq => faq.answer.includes('Fictional sample data'))).toBe(true);
    const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1];
    const schema = JSON.parse(json);
    expect(schema.mainEntity).toEqual(tool.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })));
    for (const faq of tool.faqs) expect(text(html)).toContain(faq.answer);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html.indexOf('<h2')).toBeLessThan(html.indexOf('<h3'));
  });
  it('keeps CRM merging, fuzzy comparison, variants and synchronization limitations explicit', () => {
    expect(getTool('crm-csv-cleaner')!.faqs.map(faq => faq.answer).join(' ')).toContain('Contacts are not merged automatically');
    expect(getTool('csv-compare')!.faqs.map(faq => faq.answer).join(' ')).toContain('does not use fuzzy matching');
    expect(getTool('supplier-csv-to-shopify')!.faqs.map(faq => faq.answer).join(' ')).toContain('Variants and existing-product synchronization are not supported');
  });
  it('links from About and both pricing plans to all three available tools', () => {
    const about = renderToStaticMarkup(React.createElement(About));
    const pricing = renderToStaticMarkup(React.createElement(PricingContent));
    expect(text(about)).toContain('One task. One tool. Done.');
    expect(about).not.toContain('The first available Toolgrain tool');
    for (const tool of available) {
      expect(about).toContain('href="/tools/' + tool.slug + '"');
      expect(pricing.split('href="/tools/' + tool.slug + '"')).toHaveLength(3);
    }
  });
  it('adds Compare to Shopify context while preserving existing cross-tool CTAs', async () => {
    const compare = renderToStaticMarkup(await ToolPage({ params: Promise.resolve({ slug: 'csv-compare' }) }));
    expect(compare).toContain('Prepare the updated supplier CSV for Shopify');
    expect(compare).toContain('href="/tools/supplier-csv-to-shopify"');
    expect(compare).toContain('href="/tools/crm-csv-cleaner"');
    const shopify = renderToStaticMarkup(await ToolPage({ params: Promise.resolve({ slug: 'supplier-csv-to-shopify' }) }));
    expect(shopify).toContain('Need to compare supplier files first?');
    expect(shopify).toContain('href="/tools/csv-compare"');
  });
  it('covers every available tool and only existing intended public pages without invented modification dates', () => {
    const entries = sitemap();
    expect(new Set(entries.map(entry => entry.url)).size).toBe(entries.length);
    expect(entries).toHaveLength(9);
    for (const tool of available) expect(entries.some(entry => entry.url === 'https://toolgrain.com/tools/' + tool.slug)).toBe(true);
    for (const entry of entries) {
      expect(entry.lastModified).toBeUndefined();
      if (!entry.url.includes('/tools/')) {
        const route = entry.url.replace('https://toolgrain.com', '').replace(/\/$/, '');
        expect(readFileSync(new URL('../src/app' + route + '/page.tsx', import.meta.url), 'utf8')).toBeTruthy();
      }
    }
  });
});

import React from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import Guide, { metadata } from '../src/app/guides/supplier-csv-to-shopify/page';
import CompareGuide, { metadata as compareMetadata } from '../src/app/guides/compare-csv-files-by-sku/page';
import { ShopifyInformation } from '../src/components/tools/shopify-information';
import { ToolTour } from '../src/components/guides/tool-tour';
import { shopifyTourSteps } from '../src/config/shopify-tour';
import sitemap from '../src/app/sitemap';
import { parseCsvText } from '../src/lib/csv/parse-csv';
import { suggestMappings } from '../src/lib/shopify/mapping';
import { transformSupplier } from '../src/lib/shopify/transform';
import { defaultOptions } from '../src/lib/shopify/types';
import { createWorkingOutput, applyOutputEdit } from '../src/lib/shopify/working';
import { canExport } from '../src/lib/shopify/validate';

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());
const path = '/guides/supplier-csv-to-shopify';
const url = 'https://toolgrain.com' + path;
const render = () => renderToStaticMarkup(<Guide />);
function exampleResult() {
  const html = render();
  const text = html.match(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/)![1];
  const csv = parseCsvText(text);
  return { csv, mapping: suggestMappings(csv.columns), result: transformSupplier(csv, suggestMappings(csv.columns)) };
}

describe('Shopify preparation guide', () => {
  it('renders a public server page with one H1 and all practical sections', () => {
    const source = readFileSync(new URL('../src/app' + path + '/page.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('use client');
    const html = render();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('How to Convert a Supplier CSV for Shopify</h1>');
    for (const heading of ['Example supplier CSV', 'Common data issues: errors vs. warnings', 'Step-by-step: Convert your supplier CSV', 'Limitations to check before import', 'Prepare your supplier CSV with a reviewable workflow']) expect(html).toContain(heading);
    expect(html.indexOf('<h2')).toBeLessThan(html.indexOf('<h3'));
    expect(html).toContain('aria-label="Breadcrumb"');
  });
  it('uses the requested metadata, canonical and index directives', () => {
    expect(metadata.title).toEqual({ absolute: 'How to Convert Supplier CSV Files for Shopify | Toolgrain' });
    expect(metadata.description).toBe('Learn how to map supplier CSV columns to Shopify fields, fix product data issues and prepare Shopify-compatible CSV files with a practical example.');
    expect(metadata.alternates?.canonical).toBe(url);
    expect(metadata.openGraph).toMatchObject({ url });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
  it('includes both guides exactly once without invented modification dates', () => {
    for (const guide of [url, 'https://toolgrain.com/guides/compare-csv-files-by-sku']) {
      const entries = sitemap().filter(entry => entry.url === guide);
      expect(entries).toHaveLength(1); expect(entries[0].lastModified).toBeUndefined();
    }
  });
  it('adds the contextual tool backlink and correct CTAs while preserving Compare links', () => {
    const html = render();
    expect(html).toContain('href="/tools/supplier-csv-to-shopify"');
    expect(html).toContain('Try Supplier CSV to Shopify');
    expect(html).toContain('Start with fictional sample products. No account required.');
    expect(html).toContain('href="/tools/csv-compare"');
    const info = renderToStaticMarkup(<ShopifyInformation />);
    expect(info).toContain('href="' + path + '"');
    expect(info).toContain('href="/tools/csv-compare"');
  });
  it('reuses the existing ToolTour with exactly four typed steps and valid optimized local assets', () => {
    const page = Guide();
    const article = page.props.children;
    const tour = article.props.children.find((node: React.ReactElement | null) => node?.type === ToolTour);
    expect(tour.props.steps).toBe(shopifyTourSteps);
    expect(shopifyTourSteps.map(step => step.title)).toEqual(['Load your supplier CSV', 'Map product columns', 'Review and fix issues', 'Export your Shopify CSV']);
    for (const step of shopifyTourSteps) {
      const image = readFileSync(new URL('../public' + step.image.src, import.meta.url));
      expect(image.toString('ascii', 8, 12)).toBe('WEBP');
      expect(image.length).toBeLessThan(100_000);
      expect(step.image.width).toBe(1160); expect(step.image.height).toBe(720);
      expect(step.image.alt).toBeTruthy();
    }
  });
  it('matches the displayed column mapping and error/warning counts using real validators', () => {
    const { csv, mapping, result } = exampleResult();
    expect(csv.rows).toHaveLength(5);
    expect(mapping).toMatchObject({ SKU: 'column_0', Title: 'column_1', Description: 'column_2', Price: 'column_3', 'Inventory quantity': 'column_4', Type: 'column_5' });
    expect(mapping['Product category']).toBeUndefined();
    expect(result.summary).toMatchObject({ errors: 3, warnings: 1 });
    expect(canExport(result)).toBe(false);
    expect(result.rows[0].SKU).toBe('00012345');
    expect(render()).toContain('3 blocking errors and 1 warning');
    for (const type of ['missing_title', 'invalid_price', 'invalid_inventory']) expect(result.issues.some(issue => issue.type === type && issue.severity === 'error')).toBe(true);
    expect(result.issues.some(issue => issue.type === 'empty_price' && issue.severity === 'warning')).toBe(true);
  });
  it('makes the documented corrections exportable while retaining the warning until the blank price is filled', () => {
    const { result } = exampleResult();
    let working = createWorkingOutput(result);
    working = applyOutputEdit(working, 2, 'Title', 'Maple Bookmark', defaultOptions);
    working = applyOutputEdit(working, 3, 'Price', '16.90', defaultOptions);
    working = applyOutputEdit(working, 4, 'Inventory quantity', '48', defaultOptions);
    expect(working.result.summary).toMatchObject({ errors: 0, warnings: 1 });
    expect(canExport(working.result)).toBe(true);
    working = applyOutputEdit(working, 5, 'Price', '5.90', defaultOptions);
    expect(working.result.summary).toMatchObject({ errors: 0, warnings: 0 });
    expect(result.rows[1].Title).toBe('');
    expect(working.result.rows[0].SKU).toBe('00012345');
  });
  it('states current limitations, taxonomy review, local processing and real editing controls', () => {
    const html = render();
    for (const copy of ['does not directly import products', 'variants are not supported', 'Existing-product synchronization is not supported', 'Multiple images per product are not supported', 'does not reconcile supplier categories or verify taxonomy values', 'cannot restore digits or zeros', 'not as a guarantee', 'run locally in your browser', 'Save icon or Enter', 'X or Escape', 'Try with sample CSV', 'Validate and preview', 'Download Shopify CSV']) expect(html).toContain(copy);
    expect(html).not.toMatch(/guaranteed import|automatically sync|fuzzy matching/i);
  });
  it('preserves the original guide metadata, content and auth noindex exclusions', () => {
    expect(compareMetadata.alternates?.canonical).toBe('https://toolgrain.com/guides/compare-csv-files-by-sku');
    expect(renderToStaticMarkup(<CompareGuide />)).toContain('See CSV Compare in action');
    for (const route of ['login', 'signup', 'account']) {
      const source = readFileSync(new URL('../src/app/' + route + '/page.tsx', import.meta.url), 'utf8');
      expect(source).toMatch(new RegExp("pageMetadata\\([^;]*'\\/" + route + "',false\\)"));
      expect(sitemap().some(entry => entry.url === 'https://toolgrain.com/' + route)).toBe(false);
    }
  });
});

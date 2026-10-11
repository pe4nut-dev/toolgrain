import React from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import Guide, { metadata } from '../src/app/guides/compare-csv-files-by-sku/page';
import { DataToolInformation } from '../src/components/tools/data-tool-information';
import sitemap from '../src/app/sitemap';
import { parseCsvText } from '../src/lib/csv/parse-csv';
import { compareCsv } from '../src/lib/csv-compare/compare-csv';

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());
const path = '/guides/compare-csv-files-by-sku';
const url = 'https://toolgrain.com' + path;
const render = () => renderToStaticMarkup(<Guide />);

describe('SKU comparison guide', () => {
  it('has a public App Router page with server-rendered semantic tutorial content', () => {
    const source = readFileSync(new URL('../src/app' + path + '/page.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('use client');
    const html = render();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('How to Compare Two CSV Files by SKU (Even When Rows Are Reordered)</h1>');
    for (const heading of ['Example: Original vs. updated catalog', 'Why matching by SKU works', 'Step-by-step: Compare files with Toolgrain', 'Common mistakes', 'Compare your product catalogs by SKU']) expect(html).toContain(heading);
    expect(html.indexOf('<h2')).toBeLessThan(html.indexOf('<h3'));
    expect(html).toContain('<article>');
    expect(html).toContain('<th scope="col">SKU</th>');
  });
  it('uses unique indexable metadata and the production canonical through the existing helper', () => {
    expect(metadata.title).toEqual({ absolute: 'How to Compare Two CSV Files by SKU | Toolgrain' });
    expect(metadata.description).toBe('Learn how to compare CSV files by SKU, detect added, removed and changed rows, and handle reordered product catalogs using practical examples.');
    expect(metadata.alternates?.canonical).toBe(url);
    expect(metadata.openGraph).toMatchObject({ url, title: 'How to Compare Two CSV Files by SKU | Toolgrain' });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
  it('includes the guide exactly once in the sitemap without fabricated dates', () => {
    const entries = sitemap().filter(entry => entry.url === url);
    expect(entries).toHaveLength(1);
    expect(entries[0].lastModified).toBeUndefined();
  });
  it('links the guide and CSV Compare in both directions without advertising it on CRM', () => {
    expect(render()).toContain('href="/tools/csv-compare"');
    expect(renderToStaticMarkup(<DataToolInformation compare />)).toContain('href="' + path + '"');
    expect(renderToStaticMarkup(<DataToolInformation compare={false} />)).not.toContain(path);
    const html = render();
    expect(html).toContain('Try CSV Compare with sample files →');
    expect(html).toContain('No account required. Your CSV files stay in your browser.');
    expect(html.indexOf('See CSV Compare in action')).toBeGreaterThan(html.indexOf('Why matching by SKU works'));
    expect(html.indexOf('See CSV Compare in action')).toBeLessThan(html.indexOf('Step-by-step: Compare files with Toolgrain'));
  });
  it('computes exactly the published results from the visible CSV examples using the real parser and comparison', () => {
    const html = render();
    const examples = [...html.matchAll(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(match => parseCsvText(match[1]));
    expect(examples).toHaveLength(2);
    const [old, next] = examples;
    expect(old.rows).toHaveLength(4); expect(next.rows).toHaveLength(4);
    const result = compareCsv(old, next, 'column_0', 'column_0');
    expect(result.issues).toHaveLength(0);
    expect(result.added.map(row => row.key)).toEqual(['00012349']);
    expect(result.removed.map(row => row.key)).toEqual(['00012348']);
    expect(result.unchanged.map(row => row.key)).toEqual(['00012347']);
    expect(result.changed.map(row => [row.key, row.changes])).toEqual([
      ['00012345', [{ column: 'price', oldValue: '12.90', newValue: '13.90' }]],
      ['00012346', [{ column: 'stock', oldValue: '15', newValue: '11' }]],
    ]);
    expect(next.rows[0].column_0).not.toBe(old.rows[0].column_0);
    expect(html).toContain('1 added, 1 removed, 2 changed and 1 unchanged product');
    for (const row of [...result.added, ...result.removed, ...result.changed, ...result.unchanged]) expect(html).toContain('<code>' + row.key + '</code>');
  });
  it('documents actual key matching, schema limitations, samples and report exports', () => {
    const html = render();
    for (const copy of ['Try with sample files', 'Old file key', 'New file key', 'Compare CSVs', 'Only shared non-key columns are compared', 'keeps case significant', 'does not use fuzzy matching', 'conflicts are not resolved automatically', 'not an automatically merged product catalog', 'cannot restore zeros', 'separate, larger fictional example']) expect(html).toContain(copy);
    const source = readFileSync(new URL('../src/components/tools/apps/csv-compare.tsx', import.meta.url), 'utf8');
    for (const label of ['Try with sample files', 'Old file key', 'New file key', 'Compare CSVs']) expect(source).toContain(label);
  });
});

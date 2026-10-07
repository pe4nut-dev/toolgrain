import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { analyticsPublicPaths } from '../src/lib/analytics';
import { createUmamiPrivacyFilter } from '../src/lib/umami';

const website = 'bab65517-c03d-496f-b6e5-4891619fe213';
const filter = createUmamiPrivacyFilter(analyticsPublicPaths, website);
const pageview = { website, hostname: 'toolgrain.com', url: '/tools', screen: '1920x1080', language: 'en-US' };

describe('Umami anonymous automatic pageviews', () => {
  it.each(analyticsPublicPaths)('allows the central public path %s', url => {
    expect(filter('event', { ...pageview, url })).toMatchObject({ website, url });
  });
  it('removes queries, fragments, dynamic titles and arbitrary personal/upload data', () => {
    expect(filter('event', { ...pageview, url: '/tools?email=private&token=secret#filename.csv', title: 'private.csv', email: 'private', userId: 'user', stripeId: 'cus_private', rows: ['private'] })).toEqual({ ...pageview, title: 'Toolgrain', referrer: '' });
  });
  it('limits referrers to their origin without credentials, paths or query data', () => {
    expect(filter('event', { ...pageview, referrer: 'https://user:password@example.com/private?email=private#secret' })).toMatchObject({ referrer: 'https://example.com' });
  });
  it.each(['/account', '/login', '/signup', '/auth/callback', '/unknown', '/tools/private.csv'])('blocks private or arbitrary path %s', url => {
    expect(filter('event', { ...pageview, url })).toBe(false);
  });
  it.each([{ name: 'upload' }, { id: 'user' }, { data: { filename: 'private.csv' } }])('blocks custom events or identification %j', extra => {
    expect(filter('event', { ...pageview, ...extra })).toBe(false);
  });
  it('blocks identification requests', () => expect(filter('identify', pageview)).toBe(false));
  it('rejects unexpected hosts and cross-origin page URLs', () => {
    expect(filter('event', { ...pageview, hostname: 'private.example' })).toBe(false);
    expect(filter('event', { ...pageview, url: 'https://example.com/tools' })).toBe(false);
  });
  it('drops malformed optional metadata', () => {
    const result = filter('event', { ...pageview, screen: 'private', language: 'private@example.com', referrer: 'javascript:private' });
    expect(result).toEqual({ website, hostname: 'toolgrain.com', url: '/tools', title: 'Toolgrain', referrer: '' });
  });
  it('runs its serialized guard with no module, auth or client component dependencies', () => {
    const serialized = `(${createUmamiPrivacyFilter.toString()})(${JSON.stringify(analyticsPublicPaths)},${JSON.stringify(website)})`;
    const browserFilter = runInNewContext(serialized, { URL, Set });
    expect(browserFilter('event', pageview)).toEqual(filter('event', pageview));
  });
  it('loads exactly one external tracker from the root using afterInteractive', () => {
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    const component = readFileSync('src/components/analytics/umami-analytics.tsx', 'utf8');
    expect(layout.match(/<UmamiAnalytics\s*\/>/g)).toHaveLength(1);
    expect(component.match(/src="https:\/\/cloud\.umami\.is\/script\.js"/g)).toHaveLength(1);
    expect(component).toContain('strategy="afterInteractive"');
    expect(component).toContain(website);
    expect(component).toContain('data-before-send="toolgrainUmamiBeforeSend"');
    expect(layout).toContain('strategy="beforeInteractive"');
    expect(component).not.toMatch(/umami\.(track|identify)\s*\(/);
  });
});

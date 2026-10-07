import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
vi.mock('next/image',()=>({default:({unoptimized,...props}:React.ImgHTMLAttributes<HTMLImageElement>&{unoptimized?:boolean})=>{void unoptimized;return React.createElement('img',props);}}));
import {BrandLogo} from '../src/components/brand/brand-logo';
describe('final Toolgrain brand',()=>{
 it('renders live wordmark and decorative mark',()=>{const html=renderToStaticMarkup(<BrandLogo/>);expect(html).toContain('Toolgrain');expect(html).toContain('alt=""');expect(html).toContain('/brand/toolgrain-mark.png');expect(html).toContain('width="34"');});
 it('supports compact and accessible mark-only variants',()=>{expect(renderToStaticMarkup(<BrandLogo compact/>)).toContain('width="28"');const html=renderToStaticMarkup(<BrandLogo markOnly/>);expect(html).toContain('alt="Toolgrain"');expect(html).not.toContain('brand-wordmark');});
 it('uses central branding and an accessible home link in the header',()=>{const source=readFileSync('src/components/layout/header.tsx','utf8');expect(source).toContain('<BrandLogo />');expect(source).toContain('aria-label="Toolgrain home"');expect(source).not.toContain('Boxes');expect(source).toContain('closeMenu');expect(source).toContain('Mobile navigation');});
 it('uses central branding for auth and accounts',()=>{for(const p of ['auth-form','account-content'])expect(readFileSync('src/components/auth/'+p+'.tsx','utf8')).toContain('<BrandLogo compact />');});
 it('provides static PNG assets and removes the old SVG',()=>{for(const p of ['public/brand/toolgrain-logo.png','public/brand/toolgrain-mark.png','src/app/icon.png','src/app/apple-icon.png']){const png=readFileSync(p);expect(png.subarray(1,4).toString()).toBe('PNG');}expect(existsSync('src/app/icon.svg')).toBe(false);});
});

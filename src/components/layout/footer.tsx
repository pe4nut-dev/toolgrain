import {BrandLogo} from '@/components/brand/brand-logo';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Container } from '@/components/ui/shared';
export function Footer() { return <footer><Container><div className="footer-top"><div><Link href="/" className="brand" aria-label="Toolgrain home"><BrandLogo compact /></Link><p className="muted">{siteConfig.brandLine}</p></div><nav aria-label="Footer navigation">{siteConfig.navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}<Link href="/privacy">Privacy</Link><Link href="/imprint">Imprint</Link></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {siteConfig.name}</span><span>Built for the everyday work.</span></div></Container></footer>; }

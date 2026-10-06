'use client';
import Link from 'next/link';
import {useAccount} from '@/components/auth/account-provider';
import {safeReturnPath} from '@/lib/auth/return-path';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { Boxes } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Container, ButtonLink } from '@/components/ui/shared';

export function Header() {
  const {signedIn}=useAccount();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  function closeMenu() { if (menuRef.current) menuRef.current.open = false; }
  return <header className="header">
    <Container className="header-inner">
      <Link href="/" className="brand" onClick={closeMenu}><span className="brand-icon"><Boxes size={21} aria-hidden="true" /></span>{siteConfig.name}</Link>
      <nav aria-label="Main navigation" className="desktop-nav">{siteConfig.navigation.map(item => <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <div className="header-cta"><Link className="header-account" href={signedIn?'/account':'/login?next='+encodeURIComponent(safeReturnPath(pathname))}>{signedIn?'Account':'Sign in'}</Link><ButtonLink href="/tools">Explore tools</ButtonLink></div>
      <details ref={menuRef} className="mobile-nav">
        <summary>Menu</summary>
        <nav aria-label="Mobile navigation">{siteConfig.navigation.map(item => <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} onClick={closeMenu}>{item.label}</Link>)}<Link href={signedIn?'/account':'/login?next='+encodeURIComponent(safeReturnPath(pathname))} onClick={closeMenu}>{signedIn?'Account':'Sign in'}</Link></nav>
      </details>
    </Container>
  </header>;
}

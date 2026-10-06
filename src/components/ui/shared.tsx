import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
export function Container({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) { return <div className={'container ' + className}>{children}</div>; }
export function SectionHeading({ eyebrow, title, description }: {
    eyebrow?: string;
    title: string;
    description?: string;
}) { return <div className="section-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p className="muted">{description}</p>}</div>; }
export function ButtonLink({ href, children, secondary = false }: {
    href: string;
    children: ReactNode;
    secondary?: boolean;
}) { return <Link href={href} className={'button ' + (secondary ? 'secondary' : '')}>{children}<ArrowUpRight size={16} aria-hidden="true"/></Link>; }

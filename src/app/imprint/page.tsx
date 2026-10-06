import { pageMetadata } from '@/config/metadata';
import { Container } from '@/components/ui/shared';
export const metadata = pageMetadata('Legal notice', 'Operator and contact information for Toolgrain.', '/imprint', false);
// Owner details supplied by the operator; any future placeholders MUST be completed before launch.
// Add only applicable § 5 DDG disclosures; never invent optional identifiers or contact details.
export default function Page() {
 return <Container className="page-section prose-page">
 <p className="eyebrow">LEGAL NOTICE</p><h1 className="page-title">Imprint / Legal notice</h1>
 <h2>Website operator</h2><p>Information pursuant to § 5 of the German Digital Services Act (DDG).</p>
 <dl className="legal-details"><dt>Full legal name</dt><dd>YANNICK KROLL</dd><dt>Postal address</dt><dd>HOLZER WEG 11<br />58708 MENDEN<br />DEUTSCHLAND</dd><dt>Email</dt><dd>info@toolgrain.com</dd></dl>
 </Container>;
}

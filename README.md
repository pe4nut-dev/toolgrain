# Toolgrain

Small tools for annoying business tasks.

Production domain: https://toolgrain.com
Current available tools: CRM CSV Cleaner and CSV Compare. Other registry tools are Coming Soon.

## Stack and local setup

Next.js App Router, TypeScript, React, Tailwind CSS and lucide-react. PapaParse handles client-side CSV processing. Vitest covers analysis, cleaning and export.

Requires Node.js 22.13+ and pnpm (the project pins its package manager in package.json).

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000 for local development. No application environment variables, API keys or database are required.

## Build and test

```sh
pnpm test
pnpm check:csv
pnpm typecheck
pnpm lint
pnpm build
pnpm start
```

Dev/build use webpack because Turbopack could not spawn its CSS worker in the original Windows sandbox. The project folder and package name are toolgrain.

## Architecture

- Central brand/domain/navigation: src/config/site.ts. Per-route SEO helper: src/config/metadata.ts.
- Tool registry: src/lib/tools.ts, with categories, availability, descriptions and per-tool privacy details. Component mapping lives separately in tool-workspace.tsx.
- Generic CSV layer: src/lib/csv. UTF-8 parsing, original header/value preservation, stable internal column keys and explicit CRM header alias detection. Parser errors are converted to readable messages.
- CRM analyzer: src/lib/crm. Typed issues, counts and indexed duplicate groups. It never modifies source rows.
- CRM cleaning/export: src/lib/crm/clean. Frozen independent originals, separate working copies, analyzer-sourced safe fixes and explicit reversible duplicate decisions. Browser Blob downloads use original headers/order/delimiter with UTF-8 BOM.
- UI components: generic file workspace, data health and cleaning workflow. Preview/list batching keeps large files practical.

No accounts, database, analytics, payment integration, cloud uploads or server-side CSV processing are implemented. Vercel handles ordinary website requests separately from local CSV processing; verify the privacy notice against the production configuration.

## SEO and launch preparation

Production metadataBase, canonicals and Open Graph URLs use https://toolgrain.com. No fake OG image is supplied. The favicon reuses the header's geometric Boxes glyph.

Homepage, tools directory, CRM CSV Cleaner and About are indexable. Coming Soon tool pages are thin, so they use noindex, follow and are omitted from the sitemap until they provide substantial content or launch. Pricing is unlinked from navigation, contains no purchasable plans, uses noindex and is omitted from the sitemap. Privacy and Imprint retain noindex pending deployment-specific legal review, but remain in the sitemap as explicitly requested; review their indexing when finalized. robots.txt allows crawling so route-level noindex is visible.

The legal pages contain the supplied operator details; deployment-specific legal review remains pending. This preparation does not deploy the site or connect DNS.

## Pre-launch checklist

**LEGAL CONTENT MUST BE COMPLETED BEFORE PUBLIC PRODUCTION LAUNCH**

- [ ] Complete legal notice / imprint using the Legal launch blockers below.
- [ ] Complete final privacy policy and obtain legal review, including chosen hosting-related data handling.
- [ ] Configure production deployment and run the production build on the chosen host.
- [ ] Connect toolgrain.com and verify HTTPS/domain redirects.
- [ ] Verify production analytics decision. Currently no analytics is installed; do not add tracking without a deliberate decision.
- [ ] Final browser smoke test on the production URL, including a saved cleaned CSV download and re-import. The embedded Codex browser did not report a completed download event in Phase 6; native-browser file delivery remains unverified.
- [ ] Review legal-page indexing once content is complete, and verify canonicals, OG, favicon, robots.txt and sitemap.xml on the production host.

## Validation and limits

199 Vitest tests and 14 parser checks cover analyzer and cleaning rules, immutable originals, duplicate decisions, undo/reset, column order, duplicate headers, Unicode, delimiter roundtrips and 10,000-row smoke tests. Cleaning has no arbitrary cell editing, merging, phone country inference or automatic invalid/missing-value correction. Historical phase reports are local development artifacts and are excluded from Git.

## First GitHub / Vercel deployment

Use this application folder as the repository root: it contains package.json and pnpm-lock.yaml. Do not publish the parent Codex workspace, attachments, scratch files or screenshots. The current app folder has not been initialized as a Git repository.

When ready, initialize Git here, review the initial staging list and push to your chosen GitHub repository. Keep the lockfile, pnpm-workspace.yaml, source and synthetic regression fixtures. .gitignore excludes dependencies/builds, environment files, generated exports and local phase reports. It cannot remove a file that has already been committed; recheck staged files before future pushes.

For Vercel, import that GitHub repository using the Next.js framework preset. If the app is the repository root, Root Directory is the root; otherwise select the folder containing package.json. Select Node.js 24.x, which matches the tested local runtime. Use the existing build script (pnpm build) and the framework's default output settings. No vercel.json, custom output directory or application environment variables are required.

The project pins pnpm@11.25.0. To honor this pin on Vercel, set the **build-tool setting** ENABLE_EXPERIMENTAL_COREPACK=1 in the Vercel project environment. This is not an application secret or runtime dependency. Leave the install command at its detected default; do not override it with a bare pnpm install, which can select an older version. See [Vercel package managers](https://vercel.com/docs/package-managers) and [Corepack build configuration](https://vercel.com/docs/builds/configure-a-build#corepack).

Production canonicals remain fixed at https://toolgrain.com, including on preview deployments. Complete the legal pre-launch checklist above before making a production launch public. Deployment and DNS configuration are performed by the owner; this preparation does not publish anything.

## Legal launch blockers

**Owner details have been populated using information supplied by the operator. No owner placeholders remain. Any future placeholders MUST be completed before launch. These pages are not legally certified.**

- [x] Replace controller placeholders with the supplied name, postal address and email.
- [x] Replace imprint placeholders with the supplied operator details
- [ ] Check legal form and additional applicable § 5 DDG details: representation, register, VAT/business identification number, licensing authority or regulated profession. Add only applicable verified fields; no empty optional fields or invented telephone number. Verify contact arrangements allow the required direct communication.
- [ ] Verify hosting plan supports commercial use. [Vercel Hobby](https://vercel.com/docs/plans/hobby) is limited to non-commercial personal use; confirm the actual subscription.
- [ ] Verify Vercel contractual/privacy setup: applicable processing terms, provider/subprocessor roles, enabled integrations/security features, locations, actual log categories/retention and international-transfer safeguards. No account-specific DPA or exact transfer mechanism has been verified.
- [ ] Verify the actual email provider, processing terms, retention practice and international transfers; update the notice accordingly.
- [ ] Re-run cookie/storage/tracker audit after adding any future analytics, auth, payments or third-party embeds, and on the public deployment before launch. Assess consent before enabling non-essential features.

### Cookie, storage and tracker audit — 6 October 2026

Scope: application source, root layout/footer, public assets, configuration, manifest/lockfile and CSV read/analysis/export paths. Code audit only; Vercel account settings and the public deployment were not inspected.

| Item | Finding |
| --- | --- |
| Cookies | No cookie APIs, cookie-setting routes or application cookie features. |
| localStorage / sessionStorage | Neither used; no IndexedDB, Cache API or service-worker persistence. CSV state uses browser/React memory. |
| Analytics / tracking | No analytics/tracking libraries installed; no Vercel Analytics or Speed Insights integration. |
| Third-party scripts / embeds / pixels | None integrated. Existing system fonts; no Google-hosted fonts. Next.js first-party runtime scripts are separate. |
| CSV requests | FileReader reads locally; PapaParse parses/unparses strings; analysis/cleaning use browser state; export uses Blob/object URLs. No fetch, XHR, beacon, WebSocket, server action or upload endpoint transmits CSV contents. |
| Email | No form or email SDK. Actual mailbox provider requires owner verification. |
| Footer | Root layout provides Privacy and Imprint links on every application page, including tool and not-found routes. |

No non-essential browser storage/tracking found, so no cookie banner or consent logic was added. Normal browser resource caching and requested downloads are separate. Verify production response headers, cookies and injected scripts: Vercel platform integrations/protection can differ from repository code.

Sources: [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html), [GDPR](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679), [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html), [Vercel privacy notice](https://vercel.com/legal/privacy-notice). Vercel's own notice does not replace contractual verification for this deployment.

## CSV Compare — Phase 8.1

Two single-file CSV dropzones reuse the generic parser and the existing local workspace. Each accepts UTF-8 CSV up to 10 MB. Comparison core lives in src/lib/csv-compare and is independent of React and CRM logic.

Key values are trimmed and indexed with Maps; case and punctuation remain significant. A duplicate key in either file excludes every record for that key in both files, including a unique counterpart. Missing keys are grouped separately by file. Key issues counts issue groups; the UI also reports the total excluded rows. Record numbers count parsed records, including the header, rather than physical lines.

Shared columns are paired by exact header name, regardless of order. Only shared non-key fields are compared as original strings. Columns unique to a file are schema changes, not changed records. Repeated headers cannot be paired safely and are disclosed separately and excluded from field comparison; key selections identify their column position. With no comparable fields, matched unique keys are unchanged and the UI explains that limitation.

Results expose Added, Removed, Changed, Unchanged and Key issues, with initial batches of 50 and Show more. Changed details show only fields that differ. File selection/removal/replacement or a key change discards the old result. No uploads, API routes or browser persistence are implemented. Local comparison exports are documented in Phase 8.2 below. Single keys only; no fuzzy matching, normalization options or XLSX support. Key suggestions are optional and not implemented.

26 comparison tests include a 10,000-row-per-file smoke test, key ambiguity, reordered schemas, exact value comparison, different delimiters and browser fixtures. Core classification uses O(n + m) key indexing/iteration plus shared-field comparisons for matched records.

## CSV Compare — Phase 8.2 exports

Four category downloads are generated on demand from the current comparison; replacing/removing either file or changing a key removes the result and its export controls. Empty categories are disabled and the export helper returns null. Export includes the full result, regardless of the preview limit. No ZIP, bulk downloads or unchanged-row export is included.

- Added: original new-file columns/order and values, with no metadata.
- Removed: original old-file columns/order and values, with no metadata.
- Changed: key, column, old_value, new_value; one record per changed field. Key uses the original new-file spelling; original field values are preserved.
- Key issues: issue_type, file, key, record_numbers, details. One report record per file/group; record numbers are semicolon-separated. Missing keys use missing_key; duplicates use duplicate_key; a unique record blocked by an opposite-file duplicate uses ambiguous_key. The UI counts issue groups, so the CSV may contain more report records than that count.

Export uses PapaParse unparse, UTF-8 BOM and CRLF record separators, preserving quoted delimiters, whitespace, empty cells, multiline strings and Unicode. Added/Changed/Key issues use the new delimiter; Removed uses the old delimiter. Comma, semicolon and tab are supported; other delimiters fall back to comma.

Filename helper retains spaces, Unicode and multiple dots, strips a final .csv extension case-insensitively, removes path components and replaces filesystem-unsafe characters. Basenames are limited to 180 characters. Suffixes: -added.csv, -removed.csv, -changed.csv and -key-issues.csv. Empty basenames fall back to comparison.

30 export tests cover source integrity, full-result generation, roundtrips, filenames and browser Blob/download-anchor lifecycle, including a 10,000-row export. Production-style browser checks cover the controls and responsive widths (375/768/desktop). Generated report bytes re-import successfully; the embedded browser does not expose a completed download event or saved file, so native-browser file saving remains a final smoke-test item.

## CRM Cleaner — V0.2 duplicate keys and email validation

Automatic remains the default and retains the existing exact/email/phone/name-company rules. Specific columns runs separately: choose any one or more headers in the checklist, identified by stable parser column keys (repeated names display their position). Each component uses the German text comparison described below, then is encoded as a JSON array and indexed in a Map. Punctuation, suffixes and leading zeros remain significant. A row missing any selected value is excluded; selecting no columns produces no duplicate groups.

Rows sharing a complete selected key form one non-overlapping group, even if other values differ. Full rows matching after existing trim normalization remain exact; otherwise the group is likely with reason Same selected duplicate key. Original differing non-key fields and their row numbers appear in both the health report and cleaning review. Tables and match reasons use bounded previews with Show more. Grouping has linear row/key indexing plus per-column fingerprint/difference work, without all-pairs comparison.

Changing mode or selected columns recomputes from the original CSV and creates a fresh cleaning session, resetting fixes, decisions and review UI. Replacing/removing a file resets to Automatic. All rows remain kept until an explicit Keep this row decision. Original values are never rewritten by detection. No fuzzy matching, numeric equivalence or suffix stripping is implemented. The legacy optional single-key analyzer configuration remains internally compatible; the UI uses only the two separate modes.

Email validation independently recognizes normalized aliases email, e-mail, email_address, e-mail-adresse, email avis, e-mail avis, E-Mail-Avis, billing_email/billing email and contact_email/contact email (plus the existing mail alias). All recognized columns receive validation/capitalization checks; issues retain the originating header and stable column key. Automatic CRM semantic matching is unchanged. Header detection uses explicit aliases, so arbitrary additional email header names may require extending the list; email metadata such as email_status is excluded. No mailbox/deliverability verification occurs.

32 new V0.2 tests cover composite keys, changed amount/address, exact subgroups, missing components, immutable original values, visible differences, mode/session resets, no automatic removal, 10,000-row bounded matching and multiple email aliases including invalid E-Mail-Avis beside a valid E-Mail. Together with 20 legacy custom-key regressions and the existing suites, 215 tests pass. No CSV contents are transmitted to a server or persisted in browser storage.

### German spelling equivalence

Specific columns always treats German umlaut spellings as equivalent. There is no checkbox; future language selection is not implemented yet. Each selected component is Unicode NFC-normalized, trimmed, lowercased, whitespace-collapsed and compared with ä/ö/ü/ß mapped to ae/oe/ue/ss. Punctuation, suffixes and leading zeros remain significant. This applies only to internal comparison keys; raw key values, row previews and exports retain original spelling. Automatic name/company comparison reuses the helper before its existing identity normalization; email and phone rules remain separate, and arbitrary IDs are not automatically transliterated. Location can be selected for comparison; location alone is not a new automatic duplicate signal.

16 additional regressions cover German spellings, uppercase and decomposed Unicode, always-on selected-key behavior, automatic identity matching, separate email/ID handling, original/export integrity, match reasons and 10,000-row matching. All 215 tests, TypeScript, ESLint and production build pass.

## SEO

Production domain: https://toolgrain.com
Sitemap: https://toolgrain.com/sitemap.xml
Robots: https://toolgrain.com/robots.txt

Important indexed routes: /, /tools, /tools/crm-csv-cleaner, /tools/csv-compare and /about. Privacy and imprint are also indexable and included in the sitemap. Available tool URLs come from the central registry. Coming Soon pages remain public but are thin planned-workflow placeholders, so they stay noindex/follow and excluded from the sitemap.

Every route owns its canonical and Open Graph URL. Available tools have static explanations, use cases, reciprocal links and visible FAQs. FAQPage JSON-LD uses exactly the same registry FAQs; the homepage includes minimal WebSite data without SearchAction. SoftwareApplication data is omitted to keep this phase minimal and avoid implying ratings, pricing or offers. No analytics/tracking is added.

Google Search Console is configured externally. After deploying these code changes, submit or refresh the sitemap in Search Console and inspect the homepage and available-tool URLs. Check deployed canonicals, crawling and structured data; indexing and rich-result eligibility are controlled by search engines.

## CSV Compare V1 export verification

Four non-empty report categories are downloadable locally. Added uses new-file rows and Removed old-file rows, with original headers/order/cells. Changed exports key,column,old_value,new_value using the original new-file key. Key issues preserve the first original key spelling per file/group (missing keys are empty); record numbers include the header and use semicolon separation. Different whitespace spellings in a duplicate group remain visible in the source file. Download failures show an accessible retry message. No ZIP/XLSX, composite keys, saved comparisons or server uploads are added.

V1 check: 223 tests pass, including 30 export/download tests; TypeScript, ESLint and production build pass. Desktop/768px/375px export controls were checked without page overflow. All four generated reports were re-imported through the real file chooser successfully. The embedded browser still does not confirm a completed saved download, so an actual native-browser save remains a manual release check.

## Supplier CSV to Shopify V1

Available at /tools/supplier-csv-to-shopify; the registry supplies metadata, related tools, FAQs and its sitemap entry. Reuses the generic single-file dropzone, UTF-8 PapaParse reader (10 MB), table styling and browser download helper. All mapping, validation, transformation and export are local, without Shopify login/API or image requests. Shopify-specific modules are isolated in src/lib/shopify.

Supported current fields: Title, URL handle, Description, Vendor, Product category, Type, Tags, Published on online store, Status, SKU, Barcodes, Price, Compare-at price, Cost per item, Inventory quantity, Product image URL, Image alt text. Field definitions were checked against [Shopify’s official product CSV documentation](https://help.shopify.com/en/manual/products/import-export/using-csv). Only mapped optional fields are included, plus Title, URL handle and the safe defaults draft/false. Defaults are configurable and apply only to unmapped fields. Header suggestions use deterministic English/German aliases; ambiguous candidates stay unmapped. Stable parser keys disambiguate repeated headers. Reusing a source column warns.

Missing Title, invalid handles/duplicate mapped handles, invalid/ambiguous money, invalid nonnegative integer stock, invalid statuses/publication flags and malformed image URLs block export. Empty mapped images, HTTP URLs, duplicate SKUs, possible variants and unverified product taxonomy warn. Empty mapped Price warns because Shopify may use its default price. Issue rows refer to one-based data rows excluding the header. The UI bounds issue previews and output rows.

Unmapped handles are generated from titles using Unicode composition, German transliteration and ASCII slugs. Duplicate generated handles get collision-safe deterministic suffixes; adjustments are reported. Mapped values are preserved and duplicates block export unless Make duplicate handles unique is explicitly enabled. Case-insensitive handle collision checking is conservative. Repeated handles/SKUs and recognized product/parent ID columns warn about possible variants; this is not comprehensive variant detection. SKU strings retain original values including zeros/case; barcodes trim outer whitespace only.

Auto prices recognize clear decimal comma/point and valid mixed grouping patterns, stripping one outer currency symbol without floating-point conversion. Ambiguous single separators with three following digits require explicit Decimal comma/Decimal point choice. No rounding, currency conversion or locale API is used. All mapped monetary fields share this format.

Export uses PapaParse unparse, UTF-8 comma-separated CSV with LF lines and no Toolgrain metadata or BOM. The existing filename sanitizer supplies source-name-shopify.csv. Original CSV rows are immutable. 57 Shopify tests cover mapping, validation, handle collisions, monetary formats, string integrity, Unicode/quotes/multiline roundtrips and 10,000 products. All 281 tests, TypeScript, ESLint and production build pass. A local 10,000-product transformation/export took about 38 ms (runtime dependent), with zero errors and a successful 10,000-row reimport. Browser checks passed for 1/500/10,000 products, mapping invalidation, Title blocking and 375/768/desktop layouts; a generated Shopify file re-imported through the real file chooser.

MVP is for new simple products only. No variant options/grouping, existing variant updates, multiple images, metafields, Markets, multi-location inventory, XLSX or store connection. Public image availability, taxonomy and store-specific import behavior are not verified. Always review Shopify’s import preview. Real Shopify import and actual native-browser saved download remain manual checks; the embedded browser cannot confirm saved download completion. The shared Blob/download path is unit-tested.

## Feedback system

FeedbackCTA accepts pagePath, optional pageTitle/toolName, title, description and explicit context. SiteFeedbackCTA resolves the current pathname and names from the central tool registry and is embedded once in the root layout for all pages, including legal and not-found pages. Existing CTA styling is unchanged. Configuration in src/config/feedback.ts derives the recipient info@toolgrain.com and production URL from siteConfig.

Click flow: FeedbackCTA → createFeedbackContext → generateTicketReference → createFeedbackMailto → user email client. References use TG-YYYYMMDD-XXXX with a UTC date and four random uppercase readable characters (no identity or page data). They are generated client-side per click, not during SSR, and are not guaranteed unique or guaranteed to exist in a central ticket database. The email itself is the current record.

Subjects are [reference] Feedback – actual page/tool name. Bodies include the same reference, full https://toolgrain.com pathname URL, optional tool name and explicitly provided context, followed by a feedback prompt. Query strings, hashes and preview/localhost origins are excluded. No CSV values, filenames, attachments, IP addresses or browser fingerprints are collected. Subject/body use URL encoding. The user reviews and manually sends the email; no submitted-message claim is shown. There is no persistence, API, backend or tracking.

Ten feedback tests cover reference format/date/repeated calls, central recipient, subject/body context, production URLs, special characters/umlauts, generic fallback, filtering accidental file/user data and absence of storage/network access. All 291 tests, TypeScript, ESLint and production build pass.

Future migration: replace the mailto transport with an explicit API submission; generate persistent IDs on the server and introduce ticket statuses, an admin dashboard, replies and history. Keep FeedbackCTA’s visual API and typed context boundary. None of this backend functionality is implemented now.

### Supplier preview validation UI

The output preview indexes existing validation metadata by data row and output field. Errors and warnings are shown on the affected cells with icons and accessible explanations on hover, focus or tap. All rows / Rows with issues filters the preview only; counts and export blocking remain unchanged. Unmapped/global notes remain in a compact mapping-notes section. Long filenames wrap without truncation. Preview rendering is limited to 20 rows at a time. Regression coverage includes filename preservation, cell issue mapping, multiple messages, neutral cells, export invariants and a 10,000-row issue index.

### Inline Shopify corrections

Source supplier rows remain immutable. A working-output state retains the mapping/transformation baseline, a separate corrected result, and per-row mapped/generated/manual handle provenance. Existing output columns support focused editing for Title, URL handle, SKU, Barcodes, Price, Compare-at price, Cost per item, Inventory quantity, Product image URL, Image alt text, Vendor, Type, Tags and Status. Apply commits a correction and reuses the existing validators across a separate output snapshot, including global uniqueness checks. No validation runs on keystrokes. Unresolved monetary errors retain their original input and locale interpretation across unrelated edits. Invalid edits remain visible in the editor with announced messages.

Generated handles are regenerated deterministically on Title edits while reserving mapped/manual handles; manual handle corrections are never silently suffixed or replaced. Reset changes restores the original mapped result and issues and cancels open editors. Mapping/default/file changes invalidate corrections. Export consumes the corrected working result and remains blocked by errors. Safe suggestions, bulk editing and undo history are outside this MVP. All processing remains local, with no image fetching or external validation.

## Free / Pro foundation (Phase 11.2)

Plans, prices and limits live in `src/config/plans.ts`. `src/lib/entitlements/index.ts` owns the current-plan boundary and pure row/file-size checks. Anonymous visitors use Free. Phase 11.3 supplies authenticated plans from server-verified, RLS-protected account profiles; there is no development Pro switch, URL parameter or storage override. These local client checks are a product foundation, not secure paid-entitlement enforcement.

| Tool | Free | Planned Pro |
| --- | --- | --- |
| CRM CSV Cleaner | 500 data rows | 50,000 data rows |
| CSV Compare | 500 data rows per file | 50,000 data rows per file |
| Supplier CSV to Shopify | 100 source/product rows | 10,000 source/product rows |
| File size | 10 MB per file | 25 MB per file |

Row counts exclude the header and use the existing CSV parser’s data-row semantics. Byte limits retain the existing 1 MB = 1024² bytes convention. Exact limits are allowed. Files above row limits may be parsed locally for their counts; CRM analysis, comparison and supplier mapping/transformation are stopped. Files above size limits are rejected before parsing, with separate plan-limit and maximum-supported-limit messaging. Under-limit Free workflows include full results, review and exports.

Pricing uses central €8.90/month and €69.00/year values. Pro is coming soon; no checkout or payment details are implemented. Accounts are prepared in Phase 11.3 below. `/pricing` is indexable and in the sitemap. UpgradePrompt is reused across tools and states clearly that purchases are not available. Re-run privacy/legal review when Auth or payments are actually introduced.

## Supabase accounts (Phase 11.3)

Status: integration and reproducible setup are prepared; a Supabase project must still be configured. With absent/placeholder environment variables, account forms are disabled and anonymous Free tools continue to work. Do not enable public signup until migration, email configuration and privacy setup are complete.

### Setup

1. Create a Supabase project in your chosen region. Verify its processing contract, region, retention, backups and email providers; do not assume all processing stays in Germany/the EEA.
2. In Supabase Connect obtain the Project URL and **publishable** key (sb_publishable_...). Copy .env.example to ignored .env.local and replace both placeholders. Only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required. No service-role/secret key is needed or included. Never put sb_secret_... or a service-role JWT into NEXT_PUBLIC variables.
3. Apply supabase/migrations/202610060001_accounts.sql using Supabase SQL Editor as database administrator. Alternatively use the official Supabase CLI: supabase login, supabase link --project-ref YOUR_PROJECT_REF, then supabase db push from this project.
4. Auth → Sign In / Providers: enable Email + password, keep email confirmation enabled, and configure minimum password length of at least 8. No social providers. Magic-link login supports existing accounts only; use Signup to create an account.
5. Auth → URL Configuration: Site URL https://toolgrain.com. Allow Redirect URLs https://toolgrain.com/auth/callback and http://localhost:3000/auth/callback (including callback query parameters used below). Avoid wildcard production domains. Local development assumes port 3000. Production callbacks deliberately use toolgrain.com; Vercel preview domains are not implicitly allowed.
6. Auth → Email Templates: for **Confirm signup** and **Magic link**, use this SSR token-hash link:

   <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Continue to Toolgrain</a>

   The app always supplies emailRedirectTo ending in /auth/callback?next=..., so & is intentional. Test template rendering before launch. The callback also accepts PKCE code links if the default confirmation URL is retained; these require the requesting browser’s verifier cookie. Token-hash links support another browser. Never log passwords or auth link tokens.
7. Configure production SMTP/email delivery, sender identity and rate limits. Supabase’s default email service may restrict recipients/rates. Disable email open/click tracking; link rewriting/scanners can consume one-time tokens. Verify actual signup, confirmation and magic-link delivery.
8. In Vercel configure the two public variables for the intended environment and rebuild/redeploy. Public build-time values must match server values. No additional secret variable is needed.
9. After installing Supabase CLI/Docker, run supabase init (once, to create the local CLI configuration), supabase start, supabase db reset, supabase test db against a local/test database. supabase/tests/account_rls.sql runs ten pgTAP assertions in a rolled-back transaction. Never use production accounts as fixtures. No live project is needed for pnpm test, which mocks Supabase.

### Account and entitlement boundary

Supabase manages auth.users. public.profiles contains id, email, plan, created_at and updated_at. Its Auth ID has cascading deletion. Database triggers create/backfill Free profiles and synchronize email changes; signup metadata cannot set plan. RLS allows authenticated users to read their own profile only. No client INSERT/UPDATE/DELETE grants or policies exist. Browser users cannot promote themselves. No Stripe fields or values are invented; future trusted webhooks can write plan through a privileged backend. Limits remain exclusively in src/config/plans.ts.

Server rendering verifies the user with getUser and reads their own RLS-protected profile. Missing/error profiles fall back to Free. A read-only AccountProvider passes the verified plan to local tools. Pages render dynamically; authentication responses use private/no-store headers to prevent cross-user session/plan caching. Proxy refreshes cookies with getClaims and preserves refreshed cookies/cache headers. Authorization never trusts unverified getSession, user metadata, cookie plan fields, query switches or browser storage.

/login, /signup, /account and /auth/callback are noindex and excluded from sitemap. Anonymous /account redirects to /login?next=%2Faccount. Return destinations are restricted to known internal Toolgrain paths. Forms use server actions accepting email/password/return path only; no tool state or CSV values. Raw upstream errors are mapped to fixed messages and never logged. Sign-out revokes the Supabase session and refreshes server account state.

### Storage / privacy audit

Configured Supabase SSR persists essential access/refresh sessions and PKCE verifiers in sb-... cookies, potentially chunked. Path /, SameSite Lax, Secure in production. The official SSR defaults are browser-readable for browser/server interoperability; their contents are verified server-side. The SDK cookie max-age is a storage expiry, not JWT validity or a promised server-data retention period. Current UI uses server actions and does not instantiate the optional browser client; no localStorage/sessionStorage persistence or tokens-only/userStorage mode is enabled. No analytics, third-party external scripts, tracking or consent banner are added. Cookies support requested authentication. Re-audit if the browser helper or future integrations change.

Only account/auth metadata reaches Supabase. No Storage uploads, tool-data inserts or saved file histories. CSV analysis, comparison, corrections and exports remain in browser memory/downloads, including when signed in. The privacy policy distinguishes those boundaries without inventing a project region, retention period or transfer mechanism.

The same Supabase project can later host feedback tickets. No ticket system/schema is built now and the existing mailto flow is unchanged. Stripe, billing controls, social login, password-recovery UI and account self-deletion UI are outside this phase. Users can contact the controller for account/data requests. Complete live signup, confirmation, magic link, login, account, signout and network/privacy checks after setup. Mocked tests do not certify a deployed database’s RLS.

## Vercel Web Analytics

Installed @vercel/analytics with the Next.js component in the root layout. Only public registry-backed page paths are sent; auth/account paths, query strings, fragments and custom events are dropped by beforeSend. No CSV state or account data is passed. Vercel also collects operational analytics metadata (including referrer/device information); see its current privacy documentation. No analytics cookies or application storage were added. Earlier no-analytics audits describe the baseline before this integration. Reassess the legal basis, provider terms and retention settings for this deployment. Enable Web Analytics in the Vercel project, deploy the changes and verify page views in its dashboard. No extra environment variable is required.

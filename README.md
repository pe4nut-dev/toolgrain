# Toolgrain

Small tools for annoying business tasks.

Production domain: https://toolgrain.com
Current available tool: CRM CSV Cleaner. Other registry tools are Coming Soon.

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

No accounts, database, analytics, payment integration, cloud uploads or server-side CSV processing are implemented. Hosting may handle ordinary requests; the final privacy policy must reflect the chosen deployment.

## SEO and launch preparation

Production metadataBase, canonicals and Open Graph URLs use https://toolgrain.com. No fake OG image is supplied. The favicon reuses the header's geometric Boxes glyph.

Homepage, tools directory, CRM CSV Cleaner and About are indexable. Coming Soon tool pages are thin, so they use noindex, follow and are omitted from the sitemap until they provide substantial content or launch. Pricing is unlinked from navigation, contains no purchasable plans, uses noindex and is omitted from the sitemap. Privacy and Imprint use noindex while incomplete, but remain in the sitemap as explicitly requested; review their indexing when finalized. robots.txt allows crawling so route-level noindex is visible.

This phase prepares the code; it does not deploy the site, connect DNS or complete legal content.

## Pre-launch checklist

**LEGAL CONTENT MUST BE COMPLETED BEFORE PUBLIC PRODUCTION LAUNCH**

- [ ] Complete legal notice / imprint: replace [Legal name], [Address], [Contact email] and add applicable operator details.
- [ ] Complete final privacy policy and obtain legal review, including chosen hosting-related data handling.
- [ ] Configure production deployment and run the production build on the chosen host.
- [ ] Connect toolgrain.com and verify HTTPS/domain redirects.
- [ ] Verify production analytics decision. Currently no analytics is installed; do not add tracking without a deliberate decision.
- [ ] Final browser smoke test on the production URL, including a saved cleaned CSV download and re-import. The embedded Codex browser did not report a completed download event in Phase 6; native-browser file delivery remains unverified.
- [ ] Review legal-page indexing once content is complete, and verify canonicals, OG, favicon, robots.txt and sitemap.xml on the production host.

## Validation and limits

92 Vitest tests and 14 parser checks cover analyzer and cleaning rules, immutable originals, duplicate decisions, undo/reset, column order, duplicate headers, Unicode, delimiter roundtrips and 10,000-row smoke tests. Cleaning has no arbitrary cell editing, merging, phone country inference or automatic invalid/missing-value correction. Historical phase reports are local development artifacts and are excluded from Git.

## First GitHub / Vercel deployment

Use this application folder as the repository root: it contains package.json and pnpm-lock.yaml. Do not publish the parent Codex workspace, attachments, scratch files or screenshots. The current app folder has not been initialized as a Git repository.

When ready, initialize Git here, review the initial staging list and push to your chosen GitHub repository. Keep the lockfile, pnpm-workspace.yaml, source and synthetic regression fixtures. .gitignore excludes dependencies/builds, environment files, generated exports and local phase reports. It cannot remove a file that has already been committed; recheck staged files before future pushes.

For Vercel, import that GitHub repository using the Next.js framework preset. If the app is the repository root, Root Directory is the root; otherwise select the folder containing package.json. Select Node.js 24.x, which matches the tested local runtime. Use the existing build script (pnpm build) and the framework's default output settings. No vercel.json, custom output directory or application environment variables are required.

The project pins pnpm@11.25.0. To honor this pin on Vercel, set the **build-tool setting** ENABLE_EXPERIMENTAL_COREPACK=1 in the Vercel project environment. This is not an application secret or runtime dependency. Leave the install command at its detected default; do not override it with a bare pnpm install, which can select an older version. See [Vercel package managers](https://vercel.com/docs/package-managers) and [Corepack build configuration](https://vercel.com/docs/builds/configure-a-build#corepack).

Production canonicals remain fixed at https://toolgrain.com, including on preview deployments. Complete the legal pre-launch checklist above before making a production launch public. Deployment and DNS configuration are performed by the owner; this preparation does not publish anything.

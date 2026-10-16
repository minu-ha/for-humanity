# Changelog

## Unreleased

- Mark the prebuilt Mermaid module URL as an intentional runtime import to avoid Vite development warnings while preserving lazy loading.
- Serve static previews through Vite with explicit site output paths, document 404s and preserved font cache headers; bind to localhost, reject missing builds and occupied ports, and remove the direct Hono Node server dependency.
- Share document preparation and Hono routes between static builds and a single Vite development server; replace custom file watching and SSE with Vite updates, preserve the last valid document snapshot, and support source TSX reloads and CSS HMR.
- Avoid an extra browser reload after the first successful development request; verify recovery from an invalid initial document and shutdown after a pending file change.
- Remove seven unused color and radius tokens and align the design reference with the active styles.

- Replace direct esbuild package and browser fixture builds with Vite 8 and shared typed build configuration; preserve synchronous browser initialization and Mermaid license notices.
- Raise the upcoming package minimum Node.js version to 22.12.0 and include Vite for the development and preview commands.

- Support `for-humanity.config.ts` and publish a documented `SiteConfig` input type and generated declarations; retain `.mjs` support and reject duplicate configuration files.
- Type-check build and maintenance tools, exclude repository tests from packages, and verify configuration types in an installed consumer project.
- Split CLI and navigation checks into isolated scenarios with Korean GIVEN/WHEN/THEN conventions and Playwright failure reports.
- Fix relative links from nested documents on Windows and clean up Mermaid load errors when their widget unmounts.
- Run repository tests with standalone Vitest and split Mermaid browser checks into isolated Playwright scenarios with failure traces.

- Replace the custom ASCII grid renderer with locally hosted Mermaid 12, loaded only on pages with diagrams, with official themes, system dark mode and isolated SVG styles.
- Support Mermaid's built-in diagram types, including Tree View, and add a diagram writing guide with flowchart, sequence, state, ER and tree examples.
- Keep readable diagram source when JavaScript is disabled or loading/rendering fails. Diagram syntax errors now appear in the browser instead of stopping the build.

## 0.12.0 — 2026-10-13

- Add a `[file name]` fence meta that draws a title bar with the file name and language above the code block, sharing the `bad`/`good` tone.

## 0.11.0 — 2026-10-13

- Add `<<< ./file.ext#region meta` code snippet imports: a file inside the document root becomes a code block, with optional `#region` extraction, dedent, fence meta passthrough and dev reloads when the file changes.
- Add `bad` and `good` fence meta that tint the whole code block, with line notation drawn one step darker on top.

## 0.10.0 — 2026-10-13

- Add VitePress-style code notation through Shiki transformers: `// [!code highlight|error|warning|++|--]`, `// [!code word:name]`, meta `{2,4-6}` and a `line-numbers` meta that numbers lines with CSS counters.
- Remove the `bad`/`good` code labels added in 0.9.0; mark the lines instead.
- Draw tables and flowchart boxes with the same border color as code blocks.

## 0.9.1 — 2026-10-13

- Draw tables with an outer border and cell borders, box flowcharts with a border, and separate sections with a solid rule and 64px of space.
- Tint the whole code block of a `bad` or `good` label instead of relying on the caption, so a label can carry its reason as a code comment.

## 0.9.0 — 2026-10-13

- Add code labels: a fence meta of `bad` or `good` with an optional title renders the code block with a colored left stripe and a caption, keeping Shiki highlighting.
- Give table header rows a soft background and a solid rule, widen the space above sections to 44px and subsections to 28px, and set section headings to 15px so long reference pages read in blocks.

## 0.8.1 — 2026-10-13

- Render tab-indented code blocks at four columns per tab instead of the browser default of eight.

## 0.8.0 — 2026-10-13

- Add a `cursorFace` site setting for the pixel face that follows the mouse on desktop. It is off by default; this documentation site turns it on.
- Add an optional `port` site setting for the `dev` and `preview` servers, defaulting to 4321, so two document projects can run side by side; `preview` now reads and validates the site configuration too.

## 0.7.1 — 2026-10-11

- Set Hangul in body text, labels, inline code and the site name in bundled IBM Plex Sans KR, the source of Monoplex KR's Hangul, at its natural width; Latin stays in Monoplex KR, and code blocks and flowcharts keep two-cell Hangul for the grid.
- Tighten letter spacing to -0.03em for body text, labels and inline code, -0.04em for h2 and parts and -0.045em for h1; code blocks and flowcharts stay at 0 for the grid.
- Narrow the document navigation and outline sidebars from 240px to 200px and let the body fill the rest of a page up to 1920px instead of a 900px column, keeping the 32px gaps; show the outline from 1360px so the body stays about 800px or wider.

## 0.7.0 — 2026-10-06

- Replace Pretendard and JetBrains Mono with bundled Monoplex KR for body text, labels, code and flowcharts; align the flowchart grid to its 1:2 Latin–Hangul widths.
- Remove tree lines from the document navigation and page outline, keeping nesting through indentation.
- Remove the expand/collapse buttons and their saved branch choices; nested documents and headings are always shown.
- Tighten navigation and outline rows to 16.8px with a 1.4 line height and share a 16px gap between groups; style `On this page` like the group labels.

## 0.6.0 — 2026-10-04

- Generate `robots.txt` and `sitemap.xml` in dev and static builds when an optional public root `url` is configured; include home and encoded document URLs, and leave projects without a URL unchanged.
- Validate public HTTP(S) origins and reject crawler-file document path collisions before processing; document Cloudflare crawler policy and Markdown negotiation separately.

## 0.5.0 — 2026-10-04

- Place document loading, Markdown processing and server setup under the CLI owner; keep document tree construction under navigation and share a standalone shell-controls widget through a lifecycle-managed Hono browser root.

- Consolidate browser behavior into a single Hono JSX shell entry, with component-owned anchor effects, dev reload subscriptions and an independent cursor widget that cleans up events and timers.
- Separate CLI and browser entry folders and move package build/test commands into repository scripts using the esbuild API.

- Generate page HTML with Hono JSX and remove the React server renderer and dependencies.
- Render interactive navigation with Hono client JSX components and Hooks, including native event handlers, persisted branch state, drawer focus and scroll restoration before the first paint. Keep the Markdown body as server-generated HTML.

- Use equal 240px document and outline sidebars at 1536px and wider, showing the outline only on wide screens and keeping document navigation in the mobile drawer.
- Add separate expand/collapse buttons to document groups, parent documents, outline parts and headings with children, with every branch expanded by default.
- Persist branch choices through Zustand vanilla stores in localStorage and independent wide, desktop and drawer scroll positions in sessionStorage, restoring layout and saved choices before the first paint.
- Compile a synchronous Hono JSX navigation entry to mount branch controls before the first paint, avoiding their reappearance after page navigation and function-string serialization.
- Match idle branch controls to the tree line color and keep persistence contracts in `src/store/navigation`.

## 0.4.4 — 2026-10-04

- Keep the document list and page outline in separate native scroll areas, so a shorter outline cannot clamp the document list position.
- Restore desktop document navigation before its first paint and avoid reinserting the same navigation DOM during startup.
- Indicate remaining navigation content with conditional top and bottom fades, keeping native scrollbars in forced colors and without JavaScript.
- Connect the active outline branch through its parent while highlighting only the exact current heading.

## 0.4.3 — 2026-10-04

- Use standard native navigation scrollbars in forced-color mode so browser color adjustment cannot hide custom thumbs against the background.

## 0.4.2 — 2026-10-04

- Preserve sidebar and mobile drawer scroll positions across document navigation and reloads within a tab, independently of the main content.
- Show thin native navigation scrollbar thumbs on hover or keyboard focus, with a transparent track, Firefox thin fallback and system colors in forced-color environments.
- Explain when related sections belong in one page's headings and when a separate child document is appropriate.

## 0.4.1 — 2026-10-04

- Coalesce consecutive document and asset saves and serialize dev refreshes so bulk AI edits cannot start overlapping full-site renders and exhaust memory.
- Continue queued and later edits after failed processing, and apply only the latest valid generation.

## 0.4.0 — 2026-10-04

- Copy explicitly referenced local images and supported attachments to fingerprinted asset URLs, resolving paths relative to their Markdown files in both build and dev.
- Support reference-style images and raw HTML image sources, preserve query/hash suffixes, and reject missing files, unsupported local image formats and paths or symlinks outside the document root.
- Reload referenced image and attachment changes in dev while retaining the previous valid document and resource map after failed processing.
- Mark only the current table-of-contents anchor as active, with `aria-current="location"`, while retaining the tree path through its ancestors.
- Add image documentation, purpose-based authoring guidance and fictional design and research examples.
- Keep legacy `type: document` and `type: blueprint` inputs compatible, recommend omitting `type`, and focus the roadmap on reusable visualization and theme modules rather than a dedicated Blueprint renderer.

## 0.3.0 — 2026-10-04

- Support nested document pages with optional `parent` IDs, preserving existing groups and document URLs.
- Resolve `./` and `../` parent references relative to document files so project folders can also be used as document roots.
- Reject missing parents, self references, parent cycles and parent links across different group paths.
- Extend active, hover and keyboard focus tree paths through clickable parent documents.
- Distinguish sidebar groups from document links and page headings, and rename the table of contents to "On this page" with a gray label matching the groups.
- Clarify trunk-based development, site deployment and package release policy.

## 0.2.1 — 2026-10-04

- Fingerprint stylesheet and browser-script URLs so new pages cannot reuse assets cached from an older deployment.
- Cache fingerprinted CSS, scripts and fonts with immutable headers on Cloudflare Pages.

## 0.2.0 — 2026-10-04

- Support nested navigation with `group` name arrays while keeping single-name groups compatible.
- Order nested sibling groups with paths in `navigation`, independently of document folders.
- Extend active, hover and keyboard focus tree paths through ancestor groups.

## 0.1.2 — 2026-10-03

Documentation and release automation update. The CLI commands and Node.js requirement are unchanged.

- Link the README to the public documentation site, npm package and GitHub Releases.
- Set the package homepage to `https://for-humanity.fyi`.
- Deploy the documentation from `main` to Cloudflare Pages and preserve installation commands in served HTML.
- Verify pull requests and publish npm plus GitHub Release from matching stable version tags using Trusted Publishing.
- Add official Releases and Changelog pages to the documentation site, with the changelog generated from this file.
- Accept both npm 11 array reports and npm 12 package-keyed reports when validating release artifacts.

The `v0.1.1` attempt stopped during package validation and was not published to npm.

## 0.1.0 — 2026-10-03

First public release of the Markdown documentation CLI. Requires Node.js 22 or later.

- `dev`, `build` and `preview` commands for a document folder or the project root.
- Static HTML, CSS, a browser script, self-hosted fonts and a favicon.
- A README home page, grouped navigation, a table of contents, Markdown links and highlighted code.
- Notes, disclosures, Mermaid flowcharts, status badges and color swatches.
- System light and dark themes, mobile navigation and keyboard access.
- Root `AGENTS.md` and `CLAUDE.md` excluded from the document list.

`init`, search and deployment under a URL subpath are planned. Static output currently assumes the site root `/`.

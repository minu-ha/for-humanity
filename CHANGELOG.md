# Changelog

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

<div align="center">

<img src="https://raw.githubusercontent.com/minu-ha/for-humanity/main/src/asset/favicon.svg" width="96" height="96" alt="for humanity pixel face">

# for humanity

**Documents, for humans.**

Write Markdown. Keep the context. Share a static site.

[Documentation](https://for-humanity.fyi) · [npm](https://www.npmjs.com/package/for-humanity) · [Releases](https://github.com/minu-ha/for-humanity/releases)

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](https://github.com/minu-ha/for-humanity/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/for-humanity?style=flat-square)](https://www.npmjs.com/package/for-humanity)
![Node 22+](https://img.shields.io/badge/node-22%2B-444444?style=flat-square)
![Hono + React](https://img.shields.io/badge/Hono-%2B%20React-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) · [Guide](https://github.com/minu-ha/for-humanity/blob/main/templates/document/writing.md) · [API](https://github.com/minu-ha/for-humanity/blob/main/templates/document/api.md) · [Deployment](https://github.com/minu-ha/for-humanity/blob/main/templates/document/deployment.md) · [Korean](https://github.com/minu-ha/for-humanity/blob/main/language/README.ko.md)

</div>

## A little structure. Room to read.

- **Find your place.** Pages grouped by purpose, a reading order, a tree of contents and the current reading position.
- **Keep the detail.** Notes for context, native disclosures for implementation details, and links that open folded sections.
- **Show the connections.** Tables, highlighted code, Mermaid flowcharts, status badges and color swatches.
- **Share the result.** Static HTML, self-hosted fonts and a small browser script. No React hydration.
- **Read your way.** System-matched light and dark themes, keyboard navigation and a layout for narrow screens.

## Quick start

Node.js 22 or later and pnpm. Install the CLI in your document project:

```sh
pnpm add -D --save-exact for-humanity@0.1.2
mkdir docs
```

Create `docs/README.md` for the home page, then start the development server:

```sh
pnpm exec for-humanity dev docs
```

Open [localhost:4321](http://localhost:4321). Build and preview your static site:

```sh
pnpm exec for-humanity build docs    # Generate docs/dist
pnpm exec for-humanity preview docs
```

If your Markdown files are in the project root, use `.` instead of `docs`. The root `README.md` becomes the home page; root `AGENTS.md` and `CLAUDE.md` stay out of the site.

Version `0.1.2` supports `dev`, `build` and `preview`. `init` is planned; see the [Roadmap](https://github.com/minu-ha/for-humanity/blob/main/templates/document/roadmap.md) and [Changelog](https://github.com/minu-ha/for-humanity/blob/main/CHANGELOG.md).
Cloudflare Pages can host the generated site. See [Deployment](https://github.com/minu-ha/for-humanity/blob/main/templates/document/deployment.md) for the build settings.

### Develop the kit

To work on the CLI or read this library's guides and examples locally, run the project from source:

```sh
git clone https://github.com/minu-ha/for-humanity.git
cd for-humanity
pnpm install
pnpm dev
```

Open [localhost:4321](http://localhost:4321) to read this library's usage guides, API reference and fictional examples.

```sh
pnpm build      # Generate templates/document/dist
pnpm preview    # Preview the static site
pnpm build:pages # Add Cloudflare Pages headers and a 404 page
```

Changes pushed to `main` update the documentation site. A stable version tag such as `v0.1.2` runs checks, publishes the package to npm, then creates a GitHub Release with the same package file.
The npm README updates with each package release. See [Maintenance](https://github.com/minu-ha/for-humanity/blob/main/templates/document/maintenance.md#packaging-and-release) for the release steps.

## Make it yours

A document folder is enough to get started. Without a site configuration, the sidebar shows **for humanity**. The pixel face appears in the browser tab and follows the mouse on desktop.
The folder's `README.md` becomes the home page at `/`, with no frontmatter required. Click the site name to return home.
This repository generates [the documentation home](https://github.com/minu-ha/for-humanity/blob/main/templates/document/README.md) from its root README.md and [the site changelog](https://github.com/minu-ha/for-humanity/blob/main/templates/document/changelog.md) from CHANGELOG.md. Edit those source files, then run `pnpm sync:docs`; `pnpm dev` and `pnpm build` also sync them on startup.
Set your own name in `for-humanity.config.mjs`:

```js
export default {
    title: "Project notes",
    description: "Decisions, working notes and the details behind them.",
    navigation: ["Getting started", "Guide", "Reference", "Examples"],
};
```

See [Commands](https://github.com/minu-ha/for-humanity/blob/main/templates/document/commands.md) for using another document folder, and [Settings](https://github.com/minu-ha/for-humanity/blob/main/templates/document/settings.md) for configuration.
Each document other than the root README chooses a `group` and optional `order`. Pages stay independent; groups do not need parent documents or nested folders. Document names may share the same first letter.

## Write with context

```markdown
:::note[Scope]
What this document covers and what still needs a decision.
:::

:::details[Implementation]
The contract, code or reasoning behind the visible result.
:::
```

[Parts](https://github.com/minu-ha/for-humanity/blob/main/templates/document/parts.md) pairs source examples with their rendered results. The [Blueprint sample](https://github.com/minu-ha/for-humanity/blob/main/templates/document/blueprint.md) uses a fictional reading-list app to show a screen flow, decisions, open questions and illustrative API contracts.

## Documentation

| Group | Read |
| ----- | ---- |
| Getting started | [Commands](https://github.com/minu-ha/for-humanity/blob/main/templates/document/commands.md) · [Deployment](https://github.com/minu-ha/for-humanity/blob/main/templates/document/deployment.md) |
| Guide | [Writing](https://github.com/minu-ha/for-humanity/blob/main/templates/document/writing.md) · [Parts](https://github.com/minu-ha/for-humanity/blob/main/templates/document/parts.md) · [Settings](https://github.com/minu-ha/for-humanity/blob/main/templates/document/settings.md) |
| Reference | [API](https://github.com/minu-ha/for-humanity/blob/main/templates/document/api.md) |
| Releases | [Official releases](https://github.com/minu-ha/for-humanity/blob/main/templates/document/releases.md) · [Changelog](https://github.com/minu-ha/for-humanity/blob/main/templates/document/changelog.md) |
| Examples | [Fictional Blueprint](https://github.com/minu-ha/for-humanity/blob/main/templates/document/blueprint.md) |
| Development | [Architecture](https://github.com/minu-ha/for-humanity/blob/main/templates/document/architecture.md) · [Design](https://github.com/minu-ha/for-humanity/blob/main/templates/document/design.md) · [Maintenance](https://github.com/minu-ha/for-humanity/blob/main/templates/document/maintenance.md) · [Roadmap](https://github.com/minu-ha/for-humanity/blob/main/templates/document/roadmap.md) |

## License

[MIT](https://github.com/minu-ha/for-humanity/blob/main/LICENSE) © 2026 [minu-ha](https://github.com/minu-ha)

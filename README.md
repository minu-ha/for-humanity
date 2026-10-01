<div align="center">

<img src="src/asset/favicon.svg" width="96" height="96" alt="for humanity pixel face">

# for humanity

**Documents, for humans.**

Write Markdown. Keep the context. Share a static site.

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](LICENSE)
![Node 22+](https://img.shields.io/badge/node-22%2B-444444?style=flat-square)
![Hono + React](https://img.shields.io/badge/Hono-%2B%20React-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) · [Guide](templates/document/writing.md) · [API](templates/document/api.md) · [Deployment](templates/document/deployment.md) · [Korean](language/README.ko.md)

</div>

## A little structure. Room to read.

- **Find your place.** Pages grouped by purpose, a reading order, numbered contents and the current reading position.
- **Keep the detail.** Notes for context, native disclosures for implementation details, and links that open folded sections.
- **Show the connections.** Tables, highlighted code, Mermaid flowcharts, status badges and color swatches.
- **Share the result.** Static HTML, self-hosted fonts and a small browser script. No React hydration.
- **Read your way.** System, Light and Dark themes, keyboard navigation and a layout for narrow screens.

## Quick start

Node.js 22 or later and pnpm. Run the project from source:

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

The package is a prototype. `init` and the first npm release are planned; see the [Roadmap](templates/document/roadmap.md).
Cloudflare Pages can host the site on a `pages.dev` address without a custom domain. See [Deployment](templates/document/deployment.md) for the build settings.

## Make it yours

A document folder is enough to get started. Without a site configuration, the sidebar shows **for humanity**. The pixel face appears in the browser tab and follows the mouse on desktop.
Set your own name in `for-humanity.config.mjs`:

```js
export default {
    title: "Project notes",
    description: "Decisions, working notes and the details behind them.",
    navigation: ["Getting started", "Guide", "Reference", "Examples"],
};
```

See [Commands](templates/document/commands.md) for using another document folder, and [Settings](templates/document/settings.md) for configuration.
Each Markdown file chooses a `group` and optional `order`. Pages stay independent; groups do not need parent documents or nested folders. Document names may share the same first letter.

## Write with context

```markdown
:::note[Scope]
What this document covers and what still needs a decision.
:::

:::details[Implementation]
The contract, code or reasoning behind the visible result.
:::
```

[Parts](templates/document/parts.md) pairs source examples with their rendered results. The [Blueprint sample](templates/document/blueprint.md) uses a fictional reading-list app to show a screen flow, decisions, open questions and illustrative API contracts.

## Documentation

| Group | Read |
| ----- | ---- |
| Getting started | [Commands](templates/document/commands.md) · [Deployment](templates/document/deployment.md) |
| Guide | [Writing](templates/document/writing.md) · [Parts](templates/document/parts.md) · [Settings](templates/document/settings.md) |
| Reference | [API](templates/document/api.md) |
| Examples | [Fictional Blueprint](templates/document/blueprint.md) |
| Development | [Architecture](templates/document/architecture.md) · [Design](templates/document/design.md) · [Maintenance](templates/document/maintenance.md) · [Roadmap](templates/document/roadmap.md) |

## License

[MIT](LICENSE) © 2026 [minu-ha](https://github.com/minu-ha)

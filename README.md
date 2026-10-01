<div align="center">

<img src="src/asset/favicon.svg" width="96" height="96" alt="for humanity pixel face">

# for humanity

**Documents, for humans.**

Write Markdown. Keep the context. Share a static site.

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](LICENSE)
![Node 22+](https://img.shields.io/badge/node-22%2B-444444?style=flat-square)
![Hono + React](https://img.shields.io/badge/Hono-%2B%20React-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) · [Writing](templates/document/writing.md) · [Parts](templates/document/parts.md) · [Roadmap](templates/document/roadmap.md) · [Korean](language/README.ko.md)

<br>

<picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/readme/blueprint-dark.png">
    <img src=".github/readme/blueprint-light.png" width="100%" alt="A document with a sidebar, numbered sections, a note and a flowchart">
</picture>

</div>

## A little structure. Room to read.

- **Find your place.** A sidebar, grouped contents, numbered sections and the current reading position.
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

Open [localhost:4321](http://localhost:4321) to read the included documents and examples.

```sh
pnpm build      # Generate templates/document/dist
pnpm preview    # Preview the static site
```

The package is a prototype. `init` and the first npm release are planned; see the [Roadmap](templates/document/roadmap.md).

## Make it yours

A document folder is enough to get started. Without a site configuration, the sidebar shows the pixel face and **for humanity**.
Set your own name in `for-humanity.config.mjs`:

```js
export default {
    title: "Project notes",
    description: "Decisions, working notes and the details behind them.",
};
```

See [Commands](templates/document/commands.md) for using another document folder, and [Settings](templates/document/settings.md) for configuration.

## Write with context

```markdown
:::note[Scope]
What this document covers and what still needs a decision.
:::

:::details[Implementation]
The contract, code or reasoning behind the visible result.
:::
```

[Parts](templates/document/parts.md) pairs source examples with their rendered results. The [Blueprint sample](templates/document/blueprint.md) brings together a screen flow, decisions, open questions and API contracts.

## Documentation

[Writing](templates/document/writing.md) · [Parts](templates/document/parts.md) · [Settings](templates/document/settings.md) · [Architecture](templates/document/architecture.md) · [Contributing](templates/document/maintenance.md)

## License

[MIT](LICENSE) © 2026 [minu-ha](https://github.com/minu-ha)

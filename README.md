<div align="center">

<img src="https://raw.githubusercontent.com/minu-ha/for-humanity/main/src/asset/favicon.svg" width="96" height="96" alt="for humanity pixel face">

# for humanity

**Documents, for humans.**

Write Markdown. Keep the context. Share a static site.

[Documentation](https://for-humanity.fyi) · [npm](https://www.npmjs.com/package/for-humanity) · [Releases](https://github.com/minu-ha/for-humanity/releases)

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](https://github.com/minu-ha/for-humanity/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/for-humanity?style=flat-square)](https://www.npmjs.com/package/for-humanity)
![Node 22.12.0+](https://img.shields.io/badge/node-22.12.0%2B-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) · [Guide](https://github.com/minu-ha/for-humanity/blob/main/content/public/writing.md) · [Reference](https://github.com/minu-ha/for-humanity/blob/main/content/public/api.md) · [Deployment](https://github.com/minu-ha/for-humanity/blob/main/content/public/deployment.md) · [Korean](https://github.com/minu-ha/for-humanity/blob/main/language/README.ko.md)

</div>

## Write, organize, publish

Write Markdown with code examples, tables, images and Mermaid diagrams. Organize pages into groups and nested navigation. Use notes for context and collapsible details for longer explanations.

The result is a static site with bundled fonts, light and dark themes, keyboard navigation and a layout that adapts to narrow screens.

## Quick start

You need Node.js 22.12.0 or later and pnpm. In a project with a `package.json`, install the current published version:

```sh
pnpm add -D --save-exact for-humanity@0.13.1
```

Create `docs/README.md` for your home page:

```markdown
# Project notes

Welcome to the project documentation.
```

Start the local server:

```sh
pnpm exec for-humanity dev docs
```

Open [localhost:4321](http://localhost:4321). Edit the Markdown file and save to update the page. Follow [Commands](https://github.com/minu-ha/for-humanity/blob/main/content/public/commands.md) to add your first document.

Build and inspect the site before deployment:

```sh
pnpm exec for-humanity build docs
pnpm exec for-humanity preview docs
```

Deploy the generated `docs/dist` directory. See [Deployment](https://github.com/minu-ha/for-humanity/blob/main/content/public/deployment.md) for hosting settings.

**Next release — Unreleased:** The new layout uses project-root configuration and `content/public` and `content/private` folders. This is not included in npm `0.13.1`. See [Migration](https://github.com/minu-ha/for-humanity/blob/main/content/public/migration.md) before adopting that layout.

## Make it yours

Set the site name and the order of navigation groups:

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    description: "A guide to using the project.",
    navigation: ["Getting started", "Guide", "Reference"],
} satisfies SiteConfig;
```

With `0.13.1`, save this as `docs/for-humanity.config.ts`. In the upcoming content layout, put it in the project root. Existing `.mjs` configuration is also supported; keep one configuration file in the selected location.

Each document declares a title, description and navigation group in frontmatter. See [Writing](https://github.com/minu-ha/for-humanity/blob/main/content/public/writing.md) for a complete example and [Settings](https://github.com/minu-ha/for-humanity/blob/main/content/public/settings.md) for available options.

## Keep useful detail

```markdown
:::note[Before you start]
Check the requirements before following the steps.
:::

:::details[More information]
Add examples or explanations readers can open when needed.
:::
```

[Parts](https://github.com/minu-ha/for-humanity/blob/main/content/public/parts.md) shows the syntax alongside its rendered output.

## Documentation

| Task | Guide |
| --- | --- |
| Install and run | [Commands](https://github.com/minu-ha/for-humanity/blob/main/content/public/commands.md) |
| Write and organize pages | [Writing](https://github.com/minu-ha/for-humanity/blob/main/content/public/writing.md) · [Navigation](https://github.com/minu-ha/for-humanity/blob/main/content/public/navigation.md) |
| Add rich content | [Parts](https://github.com/minu-ha/for-humanity/blob/main/content/public/parts.md) · [Diagrams](https://github.com/minu-ha/for-humanity/blob/main/content/public/diagrams.md) · [Images](https://github.com/minu-ha/for-humanity/blob/main/content/public/images.md) |
| Configure the site | [Settings](https://github.com/minu-ha/for-humanity/blob/main/content/public/settings.md) · [Reference](https://github.com/minu-ha/for-humanity/blob/main/content/public/api.md) |
| Publish | [Deployment](https://github.com/minu-ha/for-humanity/blob/main/content/public/deployment.md) · [Crawling](https://github.com/minu-ha/for-humanity/blob/main/content/public/crawling.md) |
| Update | [Releases](https://github.com/minu-ha/for-humanity/blob/main/content/public/releases.md) · [Migration](https://github.com/minu-ha/for-humanity/blob/main/content/public/migration.md) |

## License

[MIT](https://github.com/minu-ha/for-humanity/blob/main/LICENSE) © 2026 [minu-ha](https://github.com/minu-ha)

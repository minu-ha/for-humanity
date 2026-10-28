<div align="center">

<img src="https://raw.githubusercontent.com/nomeehej/for-humanity/main/src/asset/favicon.svg" width="96" height="96" alt="for humanity pixel face">

# for humanity

**Documents, for humans.**

Write Markdown. Keep the context. Share a static site.

[Documentation](https://for-humanity.fyi) | [npm](https://www.npmjs.com/package/for-humanity) | [Releases](https://github.com/nomeehej/for-humanity/releases)

[![MIT](https://img.shields.io/badge/license-MIT-1111aa?style=flat-square)](https://github.com/nomeehej/for-humanity/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/for-humanity?style=flat-square)](https://www.npmjs.com/package/for-humanity)
![Node 22.12.0+](https://img.shields.io/badge/node-22.12.0%2B-444444?style=flat-square)
![Prototype](https://img.shields.io/badge/status-prototype-9a6400?style=flat-square)

[Quick start](#quick-start) | [Guide](https://github.com/nomeehej/for-humanity/blob/main/content/public/writing.md) | [Commands](https://github.com/nomeehej/for-humanity/blob/main/content/public/commands.md) | [Deployment](https://github.com/nomeehej/for-humanity/blob/main/content/public/deployment.md) | [Korean](https://github.com/nomeehej/for-humanity/blob/main/language/README.ko.md)

</div>

## Write, organize, publish

Write Markdown with code examples, tables and Mermaid diagrams, and add images, video and audio. Organize pages into groups and nested navigation. Use notes for context and collapsible details for longer explanations. Add translations as a folder per language.

The result is a static site with bundled fonts, light and dark themes, keyboard navigation and a layout that adapts to narrow screens.

## Quick start

You need Node.js 22.12.0 or later and pnpm. In a project with a `package.json`, install the package:

```sh
pnpm add -D --save-exact for-humanity@0.26.2
```

Copy `for-humanity.config.ts` and the `content` folder from `node_modules/for-humanity/template` into your project. If you already have documentation, follow [Migration](https://github.com/nomeehej/for-humanity/blob/main/content/public/migration.md) before moving files.

Edit `content/README.md` for your home page:

```markdown
# Project notes

Welcome to the project documentation.
```

Start the local server:

```sh
pnpm exec for-humanity dev
```

Open [localhost:4321](http://localhost:4321). Edit the Markdown file and save to update the page. Follow [Installation](https://github.com/nomeehej/for-humanity/blob/main/content/public/installation.md) to add your first document.

Build and inspect the site before deployment:

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

Deploy the generated `content/dist` directory and add it to `.gitignore`. See [Deployment](https://github.com/nomeehej/for-humanity/blob/main/content/public/deployment.md) for hosting settings.

Keep published documents in `content/public` and local notes in `content/private`. The local server shows both; builds include only public documents and the home page. Folder names are configurable.

## Interactive setup

Instead of copying the template, run `pnpm exec for-humanity init` (`npx for-humanity init` with npm).

The setup asks for a site title, documentation folder, language and hosting target: GitHub Pages, Cloudflare Workers, Cloudflare Pages or later. It prepares the configuration, first document and `docs:dev`, `docs:build` and `docs:preview` scripts. Hosting setup creates deployment files and shows the remaining service settings. Workers setup also prepares Wrangler and a `docs:deploy` script.

Existing application scripts and dependencies are kept. Review the file list before creation. See [Commands](https://github.com/nomeehej/for-humanity/blob/main/content/public/commands.md#initialize-a-project) for options and automation.

## Make it yours

Set the site name, page language and the order of navigation groups:

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    description: "A guide to using the project.",
    lang: "en",
    navigation: ["Start", "Guide", "Updates"],
} satisfies SiteConfig;
```

Save this as `for-humanity.config.ts` in the project root, alongside `package.json`. Existing `.mjs` configuration is also supported; keep only one configuration file.

Each document declares a title, description and navigation group in frontmatter. See [Writing](https://github.com/nomeehej/for-humanity/blob/main/content/public/writing.md) for a complete example and [Settings](https://github.com/nomeehej/for-humanity/blob/main/content/public/settings.md) for available options.

## Keep useful detail

```markdown
:::note[Before you start]
Check the requirements before following the steps.
:::

:::details[More information]
Add examples or explanations readers can open when needed.
:::
```

[Parts](https://github.com/nomeehej/for-humanity/blob/main/content/public/parts.md) shows the syntax alongside its rendered output.

## Documentation

| Task | Guide |
| --- | --- |
| Install and run | [Installation](https://github.com/nomeehej/for-humanity/blob/main/content/public/installation.md), [Commands](https://github.com/nomeehej/for-humanity/blob/main/content/public/commands.md) |
| Write and organize pages | [Writing](https://github.com/nomeehej/for-humanity/blob/main/content/public/writing.md), [Navigation](https://github.com/nomeehej/for-humanity/blob/main/content/public/navigation.md) |
| Add rich content | [Parts](https://github.com/nomeehej/for-humanity/blob/main/content/public/parts.md), [Diagrams](https://github.com/nomeehej/for-humanity/blob/main/content/public/diagrams.md), [Images](https://github.com/nomeehej/for-humanity/blob/main/content/public/images.md) |
| Configure the site | [Settings](https://github.com/nomeehej/for-humanity/blob/main/content/public/settings.md) |
| Publish | [Deployment](https://github.com/nomeehej/for-humanity/blob/main/content/public/deployment.md), [Crawling](https://github.com/nomeehej/for-humanity/blob/main/content/public/crawling.md) |
| Update | [Changelog](https://github.com/nomeehej/for-humanity/blob/main/content/public/changelog.md), [Migration](https://github.com/nomeehej/for-humanity/blob/main/content/public/migration.md) |

## License

[MIT](https://github.com/nomeehej/for-humanity/blob/main/LICENSE) © 2026 [nomeehej](https://github.com/nomeehej)

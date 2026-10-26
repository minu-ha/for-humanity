---
name: Installation
label: Install and run your first document
group: Start
order: 10
---

for humanity builds a documentation site from Markdown files. Use `dev` while you write, `build` when you deploy, and `preview` to check the deployed output.
Node.js 22.12.0 or later is required. The examples below use pnpm, and you can also install with npm.

## Install the package

Install it in a project that has a `package.json`.

```sh
pnpm add -D --save-exact for-humanity@0.19.0
```

If you are updating from `0.13.1` or earlier, first follow [Migration](migration.md) to change the locations of your documents and configuration.

## Initialize a site

Run the init command from the project root. To create the files by hand, follow [Your first site](#your-first-site) below.

```sh
pnpm exec for-humanity init
# npm
npx for-humanity init
```

You choose the site name, content folder, language, and deployment method. Pick a suggested value, or type directly at the same prompt. You can also move to the `Custom` row and then type. The default content folder is `content`, the default language is `ko`, and the default deployment is to set it up later.
If you choose GitHub Pages, you confirm the repository and the deployment branch. For Cloudflare, Workers is recommended. Workers initialization is supported since `0.19.0` and prepares the Worker name, the Wrangler configuration, and the build and deploy commands. The existing Cloudflare Pages option is also supported.

After you confirm the files to create, it creates the configuration, the first document, and the `docs:*` scripts. After initialization, run `pnpm docs:dev` or `npm run docs:dev`.
If a required dependency is missing, it shows the install command first. init does not install packages automatically or connect a hosting account.

Specify a new folder with `for-humanity init my-docs`. If it conflicts with an existing document, an existing configuration, or a `docs:*` script with different contents, it stops before creating any files.
For the details of each option, see [Commands](commands.md#initialize-a-project). For the deployment steps, see [Deployment](deployment.md).

## Your first site

Create the `content/public` folder and write the content to show on the home page in `content/README.md`. To start by copying the default files, see [Content layout](#content-layout) below.

```markdown
# Project notes

An introduction to the project and a usage guide.

[Get started](public/guide.md)
```

Write the document information and the body in `content/public/guide.md`.

```markdown
---
name: Guide
label: A guide for first-time users
group: Guide
order: 10
---

## Overview

This is the first document.
```

Run it from the project root.

```sh
pnpm exec for-humanity dev
```

Check the home page and the Guide document at `http://localhost:4321/`. When you save a Markdown file, the open page reloads.
You can run with the default paths without any configuration. When you add configuration, place `for-humanity.config.ts` in the project root.

Build the output to deploy and check it.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

The output is `content/dist`. Only the home page and the documents in `content/public` are included in the deployed output.

## Content layout

Keep the configuration in the project root and divide the documents into a public folder and a private folder.

Copy the configuration file and the `content` folder from the installed `node_modules/for-humanity/template` into your project. If files already exist, merge only the items you need.

```text
project/
├── for-humanity.config.ts
└── content/
    ├── README.md
    ├── public/
    │   └── getting-started.md
    ├── private/
    └── asset/
```

- `README.md`: the introduction shown on the site home page
- `public`: documents to deploy
- `private`: documents to read only locally
- `asset`: images and attachments used by public documents

`dist` is generated at build time, so add `content/dist/` to `.gitignore`. To rename the folders, see the configuration in [Settings](settings.md#content-paths).

Writing documents continues in [Writing](writing.md), the details of how commands behave in [Commands](commands.md), and publishing the result in [Deployment](deployment.md).

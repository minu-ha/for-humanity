---
name: Migration
label: Upgrade steps by version
group: Updates
order: 20
---

Starting with `0.14.0`, the configuration location and the way documents are collected change. Follow this procedure when you update from `0.13.1` or earlier. When you update from `0.14.x` to `0.15.0`, see [Update to 0.15.0](#update-to-0150). For a new project, start at [Installation](installation.md#your-first-site).

## Before and after

Previously, the configuration, the home page, and regular documents were all read from a single document folder such as `docs`. The new structure separates the configuration at the project root, the public documents folder, and the private documents folder.

```text
project/
├── for-humanity.config.ts
└── content/
    ├── README.md
    ├── public/
    │   └── guide.md
    ├── private/
    │   └── maintenance.md
    ├── asset/
    └── dist/                 # generated at build time
```

| Item | Previous | New default |
| --- | --- | --- |
| Configuration | `docs/for-humanity.config.ts` | `for-humanity.config.ts` |
| Home page | `docs/README.md` | `content/README.md` |
| Public documents | `docs/guide.md` | `content/public/guide.md` |
| Private documents | `docs/maintenance.md` | `content/private/maintenance.md` |
| Shared images and attachments | `docs/images` | `content/asset` |
| Output | `docs/dist` | `content/dist` |
| Command | `for-humanity build docs` | `for-humanity build` from the project root |

An existing flat folder is not collected as public documents automatically. The run fails when there is no public folder, so you can catch a step you missed in the migration.

## Move the files

1. Move the configuration file to the project root. Keep only one of `.ts` or `.mjs`. If it imports neighboring modules, adjust those paths as well.
2. Move the home page README to `content/README.md`. You can keep a separate root README that introduces the project.
3. Split your documents into `content/public` for documents you deploy and `content/private` for documents you read only locally. The Markdown in each folder still needs its existing frontmatter.
4. Put shared assets in `content/asset` and private assets in `content/private/asset`. Adjust the paths of links, snippets, and images to the new file locations.
5. Remove the document folder argument from your run scripts. If you run the command from another directory, specify the **project root**.
6. Point `.gitignore` and the hosting output path to `content/dist`. After you confirm the new build, clean up the old output folder.

The starter template is included in the package under `template/`. Do not overwrite your existing files; copy only the structure you need.

## Keep custom names

If renaming your folders to `content`, `public`, and `private` is difficult, set the names in the project configuration.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    content: {root: "docs", public: "published", private: "internal"},
} satisfies SiteConfig;
```

With this setup, the home page is `docs/README.md`, public documents are in `docs/published`, private documents are in `docs/internal`, and the output goes to `docs/dist`. The configuration file still stays at the project root.
To make the content root the same as the project, you can use `content.root: "."`. The public folder and the private folder must each be a separate subfolder. You cannot restore the old flat collection with `public: "."`.
For the path validation rules, see [Settings](settings.md#content-paths).

## Update links and parent references

If you keep the same relative location inside the public folder, the public URL stays the same. `content/public/guide.md` is `/guide/`, not `/public/guide/`.
Private documents move to the local `/private/maintenance/` and disappear from the public site. Even if you name the folder `internal`, the local URL uses `/private/`.

- Home page to public document: `[Guide](public/guide.md)`
- Public document to home page: `[Home](../README.md)`
- Public document to shared assets: `![Screen](../asset/screen.png)`
- Private document to public document: `[Guide](../public/guide.md)`
- `parent: guide`: the site document ID. Do not prefix it with `public/`.
- `parent: ../guide`: relative to the source file location. If you move the file, check the path again.

The home page and public documents are always included in the public build. If they reference private Markdown, images, attachments, or snippets, the build fails. HTML references and symlink targets are checked as well. Split content that needs to appear together into public material.

## Verify the result

```sh
pnpm exec for-humanity dev
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

In dev, check that documents from both folders appear. After build, check that there are no private pages, menu entries, sitemap entries, or private assets. In preview, open the public documents directly.
Deploy only the generated `dist`. If your existing hosting points to the old output path, change it before the next deployment. For hosting settings, see [Deployment](deployment.md#hosting-settings).

`private` is a rule that excludes files from deployment. Files you put in a public Git repository can be read from Git. Serving private documents behind a login is not part of this structure.

## Update to 0.15.0

Starting with `0.15.0`, some inputs that built in earlier versions become build errors. After you update, run `build` and fix the files and lines shown in the errors one by one.
The terminal prints the file and line number followed by the message `Invalid part syntax`, `Invalid code snippet`, or `Invalid asset`.

| Input | Fix |
| --- | --- |
| A `::part` with no title or an empty title | Write `::part[Title]` |
| A `::part` whose title uses a link, emphasis, or inline code, or has attributes | Write a plain text title without formatting or attributes |
| A `::part` followed by the next `::part` or the end of the document with no `##` section | Write a `##` section after the `::part` |
| A region specified with `<<<` that has no end marker | Add an end marker such as `#endregion` at the end of the region |
| A non-image file, such as a PDF in a Markdown image, `<img>`, `srcset`, or `poster` | Replace it with an image file or link to it as an attachment |
| A missing local file that the `src` of `<video>`, `<audio>`, or `<source>` points to | Add the file or fix the path |
| A local file other than MP4, WebM, or MP3 that the `src` of `<video>`, `<audio>`, or `<source>` points to | Convert it to a supported format or specify an absolute URL that serves it directly |
| A missing local file that the `src` of `<track>` or `<embed>`, or the `data` of `<object>`, points to | Add the file or fix the path |
| A format other than WebVTT for `<track>`, or a format other than PDF or an image for `<embed>` and `<object>` | Convert it to a supported format or specify an absolute URL that serves it directly |
| A raw HTML `<h1>` or `<h2>` inside Note or Details | Move the heading outside the part or write it as `<h3>` or deeper |

For links that point to a missing document or to a local file that is not deployed, and for an `<iframe>` that points to a local file, the build only shows a warning and continues.
For the authoring rules, see [Parts](parts.md#errors), [Code snippets](writing.md#code-snippets), and [Supported files](images.md#supported-files).

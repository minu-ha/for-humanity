---
name: Settings
label: Site name, content paths and navigation order
group: Guide
order: 30
---

Set the site name, content paths and navigation order in `for-humanity.config.ts`. The file and each item are optional, and omitted items use their defaults.

## Create a configuration

Create `for-humanity.config.ts` in the project root.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    description: "Usage guide and reference documents for the project",
    content: {root: "content", public: "public", private: "private"},
    navigation: ["Start", "Guide", "Updates"],
} satisfies SiteConfig;
```

With `SiteConfig`, your editor autocompletes the configuration items and flags incorrect types. Configuration values are validated when you run a command. **If you change the configuration during development, restart the server.**

If you use JavaScript, export the same object from `for-humanity.config.mjs`.

```js
// @ts-check
/** @satisfies {import("for-humanity").SiteConfig} */
export default {title: "Project notes"};
```

Keep only one of `.ts` and `.mjs` in a project.

## Site

| Key | Use | Default |
| --- | --- | --- |
| `title` | Site name in the sidebar and the browser tab | `for humanity` |
| `description` | Description of the home page in search results and link previews | None |
| `lang` | Document language tag, for example `en`, `en-US` | `ko` |
| `locales` | Translation languages, see [Languages](#languages). Supported since `0.22.0` | None |
| `basePath` | URL path to deploy under, for example `/project/`. Supported since `0.17.0` | `/` |
| `url` | Root address of the deployed site | None |
| `image` | Path of the link preview image relative to the content root | None |
| `statusImage` | Path of the 404 screen image relative to the content root. Supported since `0.20.0` | Sad expression of the default pixel face |
| `port` | Port for dev and preview, an integer from 1 to 65535 | `4321` |
| `host` | Listening address for dev and preview. Supported since `0.21.0` | `localhost` |
| `cursorFace` | Pixel face that follows the mouse on desktop | `false` |

Write the title and body of the site home in `content/README.md`. The description of a document page uses the `label` of each document. If you set `url`, crawler files, canonical URLs and link preview tags are generated. Use `image` together with `url` and point it to a PNG, JPEG, GIF or WebP file. For the URL format and the output, see [Crawling](crawling.md).

## Local server

`host` is supported since `0.21.0`.

To allow access from other devices on the same network, configure it as follows.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    host: true,
    port: 9999,
} satisfies SiteConfig;
```

| Value | Binding |
| --- | --- |
| Omitted or `false` | Listens on `localhost` only |
| `true` | Listens on all network interfaces |
| `"0.0.0.0"` | Listens on all IPv4 interfaces |
| IP or hostname string | Listens on the specified address, for example `"192.168.1.144"`, `"::1"`, `"localhost"` |

Do not add a protocol such as `http://` or a port such as `:9999` to the address. Set the port separately in `port`. Restart the server after the change.
This setting applies to `dev` and `preview`. To change it just once, use the CLI `--host`, and the CLI option takes precedence over the configuration. For the address to open in the browser and how to share only the public documents, see [Commands](commands.md#connect-over-a-local-network).

## Status screen

The shared 404 screen and `statusImage` are supported since `0.20.0`.

A missing document is shown with a pixel face in the center, the number 404, a message and a link back to the home page. The screen follows the light and dark themes, and you can read it and navigate without JavaScript.
`build` generates the same screen at `<content.root>/dist/404.html`, and `dev` and `preview` return this screen with HTTP 404 for a missing document. The error screen is excluded from the search index.
`404.html` is a reserved path for the generated error file. You cannot use a document name that produces the same path, such as `404.html.md`.

To replace the image, put the file inside the content root, for example `content/asset/status.svg`, and configure it.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    statusImage: "asset/status.svg",
} satisfies SiteConfig;
```

The path is relative to `content.root`. SVG, PNG, JPEG, GIF, WebP and AVIF are supported, and you can use it without `url`.
A public build cannot use a file in the private folder or outside the content root. If you changed the file, build again.
This setting changes only the picture on the 404 screen and keeps the favicon and the cursor face. If you omit it, the default sad pixel face is used.

## Content paths

| Key | Relative to | Default |
| --- | --- | --- |
| `content.root` | Project root | `content` |
| `content.public` | Content root | `public` |
| `content.private` | Content root | `private` |

With the defaults, the home page is `content/README.md`, the public documents are in `content/public` and the private documents are in `content/private`.
The public folder is required. If you have no private documents, you can omit the private folder.

To use different names, specify them as follows.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    content: {root: "knowledge", public: "published", private: "internal"},
} satisfies SiteConfig;
```

In this case, the home page is `knowledge/README.md`, the documents are in `knowledge/published` and `knowledge/internal`, and the output is in `knowledge/dist`. The configuration file stays in the project root.
The URL of the public document `published/guide.md` is `/guide/`, and the local URL of the private document `internal/plan.md` is `/private/plan/`.

Use relative paths within the project. `content.root: "."` is also possible, but public and private must be different subfolders. The two paths cannot be the same, and neither can be inside the other.
A path that contains `..`, `dist`, `.git` or `node_modules` cannot be used. The public folder and the private folder themselves cannot be symlinks. A symlink also cannot point outside the project or to a reserved folder.

### Public and private content

`dev` shows both kinds of documents. `build` generates only the home page and the public documents. Check the result with `preview`.
The build fails if the home page or a public document references a private document, image, attachment or code snippet.

Keep shared assets in `content/asset` and private assets in `content/private/asset`. You can rename `asset` freely, and you only need to update the links. No separate configuration is required.
`private` is a rule that excludes content from site deployment. It does not change the access permissions of files you pushed to a Git repository.

## Languages

A site has one default language and any number of translations. The default language uses `lang`, `description`, `content/README.md` and `content/public`. Each translation lives in a folder named after its language code, with its own `README.md` home page and a `public` folder that mirrors the default one.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    lang: "en",
    description: "Project notes",
    locales: {
        ko: {description: "프로젝트 안내"},
    },
} satisfies SiteConfig;
```

| Key | Use | Default |
| --- | --- | --- |
| `locales` | Translation languages keyed by language code. Each value can set the `description` of that language's home page | None |

The key is a lowercase BCP 47 language tag such as `ko` or `zh-hans`. It is the folder name under the content root, the URL prefix and the `lang` attribute of the translated pages.

```text
content/
├── README.md             # /
├── public/
│   └── guide.md          # /guide/
└── ko/
    ├── README.md         # /ko/
    └── public/
        └── guide.md      # /ko/guide/
```

A file at the same relative path is the translation of the default document. The sidebar lists only the documents of the current language, and the site name links to the home page of the current language. A page that exists in two or more languages shows a language line above its body that links to each translation. The current language is plain text, and a page without translations shows no line.

Private documents are not translated, and `content/asset` is shared by every language. A translated document references a shared asset with one more `../`, for example `../../asset/screen.png`. A plain `parent` id in a translated document refers to a document of the same language, and a parent in another language is an error. A public document of the default language cannot use a language code as its first path segment.

If you set `url`, pages that exist in two or more languages get `hreflang` alternate links in the HTML head and in the sitemap. The default language is also `x-default`. See [Crawling](crawling.md).

## Navigation

In `navigation`, list the order in which to show the sidebar groups. Each name must match the `group` in the document frontmatter.

```ts
export default {
    navigation: ["Start", "Guide", "Updates"],
};
```

Groups not in the configuration appear after the specified groups, in name order. A group with no documents is not shown. Specifying the same group twice is an error.
Set the order of documents within a group with the `order` of each document.

Specify the order of nested groups with an array of names.

```ts
export default {
    navigation: [
        "Projects",
        ["Projects", "Research"],
        ["Projects", "Decisions"],
        "Guide",
    ],
};
```

The configuration above shows Research before Decisions inside Projects. Groups with the same name are separate groups if their full paths differ.
For how to write `group` and `parent` in a document, see [Navigation](navigation.md).

## Status badges

You can display specific phrases in the body as status badges. The default phrases are `확인됨` and `확인되지 않았다`.

```ts
export default {
    status: [
        {phrase: "검토 완료", kind: "verified", date: true},
        {phrase: "확인 필요", kind: "unverified"},
    ],
};
```

| Key | Use |
| --- | --- |
| `phrase` | Non-empty phrase to find in the body |
| `kind` | `verified`: green, `unverified`: amber, `blocked`: red, `neutral`: gray |
| `date` | If `true`, a `YYYY-MM-DD` date that follows is also shown |

`blocked` and `neutral` are supported since `0.24.0`.

Writing `검토 완료 2026-10-01` in a document that uses the configuration above displays the phrase and the date as a single badge.
A phrase wrapped in parentheses is also recognized. Phrases inside headings, links and code are not converted.
Setting `status` replaces the default list. To turn the badges off, use `status: []`.

## Reference chips

Supported since `0.24.0`.

A link whose text is a configured prefix followed by a number, such as `[Q3](questions.md#q3)`, is shown as a small chip instead of an underlined link. Use it for numbered decisions and questions that the body refers to.

```ts
export default {
    refs: [
        {prefix: "Q", color: "violet"},
        {prefix: "B", color: "amber"},
        {prefix: "D"},
    ],
};
```

| Key | Use |
| --- | --- |
| `prefix` | One to three uppercase letters. Each prefix once |
| `color` | `gray` (default), `blue`, `violet` or `amber` |

Only a link whose whole text is the prefix and digits becomes a chip, so `Q3` matches and `Q3a` or `q3` does not. The link address is not changed. Without `refs`, links are shown as usual.

## Appearance

The light and dark themes follow the reader's system setting. Fonts are included in the build output.
There is currently no setting to replace the site theme or fonts.

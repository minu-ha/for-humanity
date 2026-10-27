---
name: Crawling
label: Public document URLs for search engines
group: Guide
parent: settings
order: 10
---

When you set the site address as `url`, for humanity generates `robots.txt` and `sitemap.xml`. It also adds a canonical URL and link preview tags to each page.
Specify the deployment URL in the configuration file at the project root.

## Public site URL

Specify the URL you deploy to in `for-humanity.config.ts`.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    title: "Project notes",
    url: "https://docs.example.com",
} satisfies SiteConfig;
```

Use the root address of an HTTP(S) domain for `url`. Do not include a subpath, username, password, query, or hash.
For example, `https://docs.example.com` is valid, but `https://example.com/docs/` is not.

To deploy under a subpath, specify `url: "https://example.com"` and `basePath: "/docs/"`. `basePath` is supported since `0.17.0`.
The base path is applied to the canonical URL, the link preview image, and the sitemap as well.

## Build the files

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

The default output is `content/dist/robots.txt` and `content/dist/sitemap.xml`. Deploy both files together with the rest of the build output.

With `basePath: "/docs/"`, the two files are served at `/docs/robots.txt` and `/docs/sitemap.xml`.
Search engines request `/robots.txt` at the domain root, so a robots file under a subpath cannot control the policy for the whole domain.
On a GitHub project site, you can submit the generated sitemap URL to search engines directly.

If you omit `url`, neither file is generated. Rebuild after you change the configuration.

## What is included

`robots.txt` contains the crawling instructions and the sitemap URL.

```text
User-agent: *
Allow: /

Sitemap: https://docs.example.com/sitemap.xml
```

The sitemap contains the URLs of the home page and the public documents. It does not include heading anchors, images, or fonts.
A document gets a `<lastmod>` when its last frontmatter date, `revised` or else `created`, is written with the day, such as `2026-10-05`. A month such as `2026-10` is left out because the sitemap format needs a full date. The date comes from the frontmatter as written, not from file modification times, and the home page has no `<lastmod>`. See [Writing](writing.md#dates).
With `locales`, the sitemap also lists the home page of each language. A page that exists in two or more languages carries an `xhtml:link` alternate for each language, and the default language is also `x-default`. The same alternates appear in the page head as `<link rel="alternate" hreflang>`. See [Settings](settings.md#languages).
The public build excludes private documents. In local dev, documents from both folders appear.

The `<head>` of each page gets a `<link rel="canonical">` with the same URL as in the sitemap, along with Open Graph and Twitter card tags for link previews. The preview title and description are the document's `name` and `label`, and the site's `title` and `description` for the home page.

If you set `image`, every page shows the same image in its preview. Write the path relative to the content root, like `image: "asset/preview.png"`.
Use a PNG, JPEG, GIF, or WebP file. Most preview services do not display SVG. The public build cannot use images from the private folder.

When you use `url`, `robots.txt` and `sitemap.xml` are reserved paths for the generated files. You cannot use a document name that produces the same output path, such as `robots.txt.md`.

## Verify the deployment

Check the deployment in a browser or with the following commands.

```sh
curl -i https://docs.example.com/robots.txt
curl -i https://docs.example.com/sitemap.xml
```

Check that both URLs return `200` and that the URLs in the sitemap match the actual deployed URL.
If your hosting service adds or modifies robots.txt, check against the deployed response.

The two files tell crawlers where your documents are, but they do not guarantee that the documents appear in search results. `robots.txt` is also not an access control mechanism. Exclude documents you do not want to publish from the deployed output.

---
name: Deployment
label: Deploy your documents as a static site
group: Start
order: 20
---

Build the documents, then deploy the generated output folder to static hosting. After deployment, no separate Node.js server is needed.

## Build and preview

Run the commands from the project root.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview
```

Check at `http://localhost:4321/` that the home page, direct document links, and images open.
The public output is generated in `content/dist`. If you changed `content.root`, use `dist` under that folder.

`build` deletes the previous output folder and creates new output. Do not keep files you manage by hand only inside `dist`.
If public documents or the home page reference private material, the build fails. What you deploy is the generated `dist`, not the whole source content.

## Hosting settings

`for-humanity init` supports GitHub Pages, Cloudflare Workers, Cloudflare Pages, and setting up later. Workers initialization is supported since `0.19.0`. To set up by hand, use the values below.
If you used initialization, use the generated `docs:build` script and the output path in the completion message. Choosing an option alone does not deploy to a remote service.

Since `0.20.0`, `build` generates a common `404.html` for all hosting. To replace the image, see [Status screen](settings.md#status-screen). Earlier versions use the per-host 404 preparation steps below.

Connect the documentation project to the hosting service and specify these values.

| Setting | Value |
| --- | --- |
| Project path | The folder that contains `package.json` and the configuration file |
| Build command | `pnpm exec for-humanity build` |
| Output folder | `content/dist` |
| Node.js | 22.12.0 or later |

The install step of the hosting service must be able to install the project's dependencies. Commit the package version and the lockfile together.

## Deployment path

Use `basePath` to specify the path the site is served from. If you omit it, the site deploys at the site root (`/`).
Deploying to a subpath is supported since `0.17.0`.

```ts
import type {SiteConfig} from "for-humanity";

export default {
    url: "https://username.github.io",
    basePath: "/project/",
} satisfies SiteConfig;
```

With the configuration above, the home page appears at `https://username.github.io/project/` and documents appear under paths such as `/project/guide/`.
Put only the domain address in `url`, and specify the base path in `basePath`. `basePath` starts with `/`, and the trailing slash is added automatically.
Path segments can use Latin letters, digits, `-`, `.`, `_`, and `~`. Empty segments, `.` and `..`, queries, and hashes are not allowed.

The same base path applies to document links, assets, navigation, fonts, and Mermaid. Root-relative URLs in the body such as `/guide/` are also treated as addresses inside the site.
External URLs, `//example.com/image.png`, and `#heading` are left unchanged. Write relative file links in Markdown relative to the source folder.

The output folder is still `content/dist`. Do not add a `project` folder inside it.
`dev` and `preview` also open at `/project/`. If you changed the configuration, restart the server and build again.

## GitHub Pages

`init --deploy github-pages` confirms the repository and the branch, then creates the configuration and `.github/workflows/docs.yml`.
After initialization, create the lockfile with the install command it shows, and commit the documents, configuration, package.json, lockfile, and workflow. In `Settings → Pages`, select `GitHub Actions` and push to the deployment branch.
If you entered a separate domain, also connect that domain in the repository's Pages settings.

To set it up by hand:

A project site can be created once per repository. The `username/project` repository has the default address `https://username.github.io/project/`, so specify `basePath: "/project/"`.
A user site `username.github.io`, or a separate domain connected at the site root, uses `basePath: "/"`.
See [GitHub's site types](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

1. Commit the configuration above, the documents, `package.json`, and the lockfile to the repository.
2. Specify the pnpm version you use in `packageManager` in `package.json`. For example: `"packageManager": "pnpm@10.33.2"`.
3. Copy the package's `template/github-pages.yml` to the project's `.github/workflows/docs.yml`.
4. Set the workflow branch to your actual deployment branch. The default is `main`. If you changed the content root, adjust the upload path too.
5. In the repository's `Settings → Pages → Build and deployment → Source`, select `GitHub Actions`.
6. Push to the deployment branch, or run the `Documentation` workflow in Actions manually.

The workflow builds the documents and deploys all of `content/dist`. You do not need to commit the build output to Git.
If you need a preliminary generation job or extra file copies, replace the build step with the project's documentation build command.
See [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Cloudflare Workers

For new static sites, Cloudflare recommends [Workers Static Assets](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#use-workers-static-assets-for-new-projects).
It deploys the `for-humanity` build output as is and needs no Worker server code.

### Initialize for Workers

Run it on `0.19.0` or later. Earlier versions use the manual setup below.

```sh
pnpm exec for-humanity init --deploy cloudflare-workers
# Run without prompts
pnpm exec for-humanity init --yes --deploy cloudflare-workers --worker-name team-docs
```

The Worker name must be unique within the account. Use up to 63 lowercase letters, digits, and hyphens. It suggests the project's `package.json` name or the folder name. If that name is not available, it suggests `for-humanity-docs`.
If the name collides with another Worker, the deployment updates that Worker, so check the name before the first deployment.

What initialization generates:

| File or setting | Purpose |
| --- | --- |
| `wrangler.jsonc` | The Worker name, `dist` under the chosen content folder, the document path, and 404 handling |
| `.cloudflare/404.html` | Error screen for missing documents |
| `.cloudflare/_headers` | HTML revalidation, preserving the original content, and long-term caching for assets with content fingerprints |
| `.cloudflare/prepare.mjs` | Prepares hosting files after the build |
| `docs:build` | Builds the documents and copies the deployment files |
| `docs:deploy` | Builds, then runs `wrangler deploy` |
| `wrangler` dev dependency | Adds a verified version when no existing dependency is present |

After initialization, run the dependency install command it shows, and commit the documents, configuration, deployment files, and lockfile.
The helper script in `0.20.0` keeps the 404 generated by the build and copies the default template only when none exists. If a script generated earlier overwrites the 404, remove the 404 copy step from `.cloudflare/prepare.mjs`. Keep the `_headers` copy.
If an existing `wrangler.jsonc`, `wrangler.json`, or `wrangler.toml` is present, initialization stops without overwriting it. For existing projects, connect the assets with the manual setup below.

### Workers Builds

In the Cloudflare Worker, connect the Git repository under Builds and choose the deployment branch.

| Setting | pnpm | npm |
| --- | --- | --- |
| Build command | `pnpm docs:build` | `npm run docs:build` |
| Deploy command | `pnpm exec wrangler deploy` | `npx wrangler deploy` |
| Preview command | `pnpm exec wrangler preview` | `npx wrangler preview` |
| Root directory | The folder that contains `package.json` | The folder that contains `package.json` |

The Worker name must be the same in `wrangler.jsonc` and in the dashboard. Choose Node.js `22.12.0` or later, and match the pnpm version to `packageManager` in `package.json`.
Builds takes the build and deploy commands separately. `docs:deploy` is for running both steps together locally.
If you use branch previews, set the production branch to `wrangler deploy` and the other branches to `wrangler preview`. The configuration generated by Workers initialization includes `previews: {}` and a preview URL.
For the connection steps, see [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/).

### Manual setup

For an existing project, install Wrangler as a dev dependency.

```sh
pnpm add -D --save-exact wrangler@4.152.0
```

Create `wrangler.jsonc` in the project root. If a file already exists, merge `assets` into it while preserving the other settings.
If you changed the content root, match `assets.directory` too.

```json
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "team-docs",
    "compatibility_date": "2026-10-23",
    "assets": {
        "directory": "./content/dist",
        "html_handling": "force-trailing-slash",
        "not_found_handling": "404-page"
    }
}
```

```sh
pnpm exec for-humanity build
pnpm exec wrangler dev
pnpm exec wrangler login
pnpm exec wrangler deploy
```

Since `0.20.0`, the common build's 404 is kept, and only `_headers` is copied into the output folder after the build. Replace the image with `statusImage`. In earlier versions, keep a custom `404.html` and `_headers` outside `dist` and copy them after the build.
For a project generated by initialization, the following commands handle the build and the copy together.

```sh
pnpm exec wrangler login
pnpm docs:deploy
# npm
npx wrangler login
npm run docs:deploy
```

### Site URL and custom domains

Put the `workers.dev` address you saw at the first deployment, or your real custom domain, in `url` in the site configuration and build again.
`--url` sets the address for the canonical URL and the crawler files, and it does not connect a domain automatically.
Connect a separate domain in Cloudflare's Worker Custom Domains. For the detailed steps, see [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

If you are moving from existing Pages, verify the new Worker's default address, then switch the domain and stop the Pages automatic deployment.
A `pages.dev` address is not migrated to the Worker's address automatically. See the [Pages migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/).

## Cloudflare Pages

`init --deploy cloudflare-pages` creates `.cloudflare/404.html` and `.cloudflare/prepare.mjs` and hooks the post-build copy into `docs:build`.
The build command for Git integration is `pnpm docs:build` or `npm run docs:build`, and the output is `dist` under the chosen content folder. Apply the Node.js and package manager settings it shows after generation.
If you do not know the public address yet, skip it and set `url` after deployment.

In Pages, connect the documentation project's Git repository, select `None` for Framework preset, and set the build command and output folder above.
If the existing project used a different output path, change it to the new path.
For the detailed connection steps, see [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/).

Include `404.html` in the output root so that missing documents are not shown as the home page.
Since `0.20.0`, the 404 generated by the common build is used as is. In earlier versions, copy a separately managed file into `content/dist` after the build. See [Cloudflare's rules for serving static pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Verify the deployment

- Check that the home page and the individual document URLs open.
- Check that images and fonts display correctly.
- Check that missing paths and private document paths return `404`.
- If you need crawler files, set `url` following [Crawling](crawling.md) and check `/robots.txt` and `/sitemap.xml`.

`preview` is for checking local builds. For the production site, serve the build output from static hosting.

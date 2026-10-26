---
name: Commands
label: init, dev, build and preview commands and troubleshooting
group: Guide
order: 40
---

Run the commands from the project root with `pnpm exec for-humanity`. For installation, see [Installation](installation.md).

```text
for-humanity <init|dev|build|preview> [project-dir]
```

| Command | Result |
| --- | --- |
| `init` | Choose the site information and deployment method, then create the first document and the run scripts |
| `dev` | View public and private documents together, reload on change, runs when the command is omitted |
| `build` | Generate the home page and public documents in `content/dist` |
| `preview` | View the last build output |
| `--help` or `-h` | Command help |
| `--version` or `-v` | Installed version |

`project-dir` is the project root that contains the configuration file, and it defaults to the current folder when omitted. To run from another folder, specify the **project path**, as in `for-humanity dev ../my-project`.
If you changed `content.root`, the output is `dist` under that folder. `init` is supported since `0.18.0`.

## Initialize a project

`cloudflare-workers` and `--worker-name` are supported since `0.19.0`. For the deployment steps and the manual setup, see [Cloudflare Workers](deployment.md#cloudflare-workers).

```sh
pnpm exec for-humanity init
pnpm exec for-humanity init my-docs
# npm
npx for-humanity init
```

Prompts appear only for values you did not specify. The suggested values are the project name for the site name, `content` and `docs` for the folder, and Korean and English for the language.
You can type directly at a suggested value or move to the `Custom` row to enter your own. A single Enter confirms an answer. You also confirm the detected GitHub repository and branch by accepting the suggestion or typing your own.
Before creating files, it shows the selected settings and the file list. If you cancel with Ctrl+C or with No at the final confirmation, it exits with code `130` without creating any files.

| Option | Value |
| --- | --- |
| `--title` | Site name, defaults to the name in the existing package.json or Project notes |
| `--content` | Content folder inside the project, defaults to content |
| `--lang` | Document language tag, defaults to ko |
| `--deploy` | none, github-pages, cloudflare-workers, cloudflare-pages |
| `--worker-name` | A name unique within the Workers account. Suggests an available project name or for-humanity-docs |
| `--repository` | GitHub repository owner/name, suggested when a single one is identified from local Git |
| `--branch` | GitHub deployment branch, local main/master or main |
| `--url` | Public HTTP(S) domain, a GitHub site with a separate domain is created with a root path |
| `--manager` | npm or pnpm, detected from the declaration, lockfile, and runtime environment |
| `--yes` | Skip prompts and confirmation, an unspecified deployment method is none |

Non-interactive examples:

```sh
pnpm exec for-humanity init --yes --deploy none
pnpm exec for-humanity init --yes --deploy github-pages --repository username/project --branch main
npx for-humanity init --yes --deploy cloudflare-workers --worker-name team-docs --manager npm
```

In non-interactive environments, specify `--yes` or `--deploy`. GitHub Pages requires repository information. Options you provide are validated even with `--yes`.
The package manager is chosen in this order: explicit option, packageManager, lockfile, runtime environment. If the declaration and the option conflict, or it cannot choose between two lockfiles, it explains how to fix the problem.

It keeps your existing `dev` and `build` scripts and the for-humanity dependency version, and adds only `docs:*`. It does not overwrite existing configuration, documents, or hosting files.
For a project that is already initialized, edit the configuration directly. To move existing documents, follow [Migration](migration.md).

## While editing

`dev` reflects changes to Markdown, the home page, images, and snippets. If you save an invalid document, it shows the error in the terminal and keeps the last valid document. Fix the error and save again, and the document is reflected again.
If you change the configuration file, stop the server and run it again.

`preview` shows the last build output. If you edited documents, run `build` again.
Both servers use localhost and port `4321` by default. If the port is in use, stop the existing server or set a different port with `port` in the configuration.

## Connect over a local network

`--host` and `host` in the configuration are supported since `0.21.0`.

To connect from another device on the same network, add `--host`. If you omit the value, the server accepts connections on all IPv4 interfaces.

```sh
pnpm exec for-humanity dev --host
# dev runs even when the command is omitted
pnpm exec for-humanity --host
# Use only a specific interface
pnpm exec for-humanity dev --host 192.168.1.144
```

If `port` in the configuration is `9999`, connect from another device at `http://192.168.1.144:9999`. Replace the example IP with the real IP of the computer running the server. `0.0.0.0` is a listening address setting, not an address to type into a browser.
You can use the Network address shown in the terminal. If the connection fails, check that both devices are on the same network and that the firewall allows the port.

To apply it every time, set `host` in [Settings](settings.md#local-server). The CLI `--host` takes precedence over the configuration file and does not apply to `build`. Do not include a protocol or a port in the address. Specify the port with `port` in the configuration.

`dev` also shows private documents. To share only the public documents, build and then run `preview`.

```sh
pnpm exec for-humanity build
pnpm exec for-humanity preview --host
```

## Help and troubleshooting

```sh
pnpm exec for-humanity --help
pnpm exec for-humanity build --help
pnpm exec for-humanity --version
```

| Situation | What to check |
| --- | --- |
| Content folder not found | The installed version, the positional argument of the command, and the `content.root` setting |
| frontmatter error | The YAML syntax of the document named in the error, and whether `name`, `label`, and `group` exist |
| Duplicate configuration file | Whether both `.ts` and `.mjs` exist in the same location |
| private reference error | Whether the home page or a public document links to private material |
| preview shows no changes | Whether you rebuilt after editing |

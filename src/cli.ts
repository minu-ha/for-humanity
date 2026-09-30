#!/usr/bin/env node
/*
 * for-humanity <dev|build|preview> [문서 폴더]
 * 문서 폴더의 for-humanity.config.mjs 를 읽어 Astro 를 돌린다. 폴더를 빼면 지금 폴더다.
 * 앱 (쪽, 컴포넌트, 스타일) 은 이 패키지의 src 에 있고, 문서 폴더에는 Markdown 과 설정만 있다.
 * 앱의 진입 파일이라 쪽, 부품의 플러그인, 설정을 여기서 한데 잇는다
 */

import {existsSync} from "node:fs";
import {join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {unified} from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import {type AstroInlineConfig, build, dev, preview} from "astro";
import remarkDirective from "remark-directive";
import {rehypeHead} from "@/component/widget/prose/_function/rehype-head";
import {rehypeSections} from "@/component/widget/prose/_function/rehype-sections/rehype-sections";
import {rehypeTables} from "@/component/widget/prose/_function/rehype-tables";
import {remarkFlow} from "@/component/widget/prose/_function/remark-flow";
import {remarkLinks} from "@/component/widget/prose/_function/remark-links";
import {remarkParts} from "@/component/widget/prose/_function/remark-parts";
import {remarkStatus} from "@/component/widget/prose/_function/remark-status";
import {remarkSwatch} from "@/component/widget/prose/_function/remark-swatch";
import {remarkUnknownDirectives} from "@/component/widget/prose/_function/remark-unknown-directives";
import {cli_config_file_name, cli_config_module_id, cli_default_command, cli_default_docs_dir} from "@/constant/cli";
import {copy_error_prefix, copy_error_unknown_command} from "@/constant/copy";
import {site_config_absent} from "@/constant/site";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 명령 이름과 Astro 함수의 짝. 명령 이름은 Astro CLI 의 dev · build · preview 를 그대로 따른다
 */
const commands = new Map<string, (config: AstroInlineConfig) => Promise<unknown>>([
	["dev", dev],
	["build", build],
	["preview", preview],
]);
const [command = cli_default_command, docsDir = cli_default_docs_dir] = process.argv.slice(2);
const run = commands.get(command);

if (run === undefined) {
	console.error(`${copy_error_prefix}: ${copy_error_unknown_command}: ${command} (${[...commands.keys()].join(", ")})`);
	process.exit(1);
}

// 이 파일은 dist/cli.js 로 묶여 돈다. 거기서 한 칸 올라가면 패키지 뿌리다
const srcDir = fileURLToPath(new URL("../src/", import.meta.url));
const docsRoot = resolve(docsDir);
const configFile = join(docsRoot, cli_config_file_name);
const siteConfig = siteConfigSchema.parse(
	existsSync(configFile) ? (await import(pathToFileURL(configFile).href)).default : site_config_absent,
);

await run({
	root: docsRoot,
	srcDir,
	publicDir: join(docsRoot, "public"),
	outDir: join(docsRoot, "dist"),
	cacheDir: join(docsRoot, "node_modules", ".for-humanity"),
	configFile: false,
	integrations: [
		mdx(),
		react(),
		{
			name: "for-humanity",
			hooks: {
				// 쪽은 쓰는 사람의 문서 폴더가 아니라 이 패키지에 있으므로 src/pages 대신 여기서 라우트를 잇는다
				"astro:config:setup": (options) => {
					options.injectRoute({pattern: "/", entrypoint: join(srcDir, "page/home/pg-home.astro")});
					options.injectRoute({pattern: "/[...slug]", entrypoint: join(srcDir, "page/doc/pg-doc.astro")});
				},
			},
		},
	],
	markdown: {
		syntaxHighlight: false,
		// Astro 7 의 기본 처리기 (Sätteri) 는 remark · rehype 플러그인을 받지 않아 unified 처리기를 쓴다
		processor: unified({
			remarkPlugins: [
				remarkDirective,
				remarkParts,
				remarkFlow,
				[remarkStatus, {status: siteConfig.status}],
				remarkSwatch,
				[remarkLinks, {root: docsRoot}],
				remarkUnknownDirectives,
			],
			rehypePlugins: [[rehypeHead, {title: siteConfig.title}], rehypeSections, rehypeTables],
		}),
	},
	vite: {
		resolve: {alias: [{find: /^@\//, replacement: srcDir}]},
		plugins: [
			{
				name: "for-humanity:config",
				resolveId: (id) => (id === cli_config_module_id ? `\0${cli_config_module_id}` : undefined),
				load: (id) =>
					id === `\0${cli_config_module_id}`
						? `export const siteConfig = ${JSON.stringify(siteConfig)};\nexport const docsRoot = ${JSON.stringify(docsRoot)};`
						: undefined,
			},
		],
		server: {fs: {allow: [srcDir, docsRoot]}},
	},
});

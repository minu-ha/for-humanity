#!/usr/bin/env node
/*
 * for-humanity <dev|build|preview|sync> [문서 폴더]
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
import {type AstroInlineConfig, type AstroUserConfig, build, dev, preview, sync} from "astro";
import {fontProviders} from "astro/config";
import remarkDirective from "remark-directive";
import {createCssVariablesTheme} from "shiki";
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
import {copy_error_prefix, copy_error_unknown_command, copy_toolbar_name} from "@/constant/copy";
import {font_css_variable_mono, font_css_variable_sans} from "@/constant/font";
import {site_config_absent} from "@/constant/site";
import {toolbar_app_id, toolbar_report_event} from "@/constant/toolbar";
import {remarkReport} from "@/toolbar/remark-report";
import {report} from "@/toolbar/report";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 명령 이름과 Astro 함수의 짝. 명령 이름은 Astro CLI 의 dev · build · preview · sync 를 그대로 따른다.
 * sync 는 문서 모음의 타입만 만든다 (astro-check 가 읽는다)
 */
const commands = new Map<string, (config: AstroInlineConfig) => Promise<unknown>>([
	["dev", dev],
	["build", build],
	["preview", preview],
	["sync", sync],
]);
const [command = cli_default_command, docsDir = cli_default_docs_dir] = process.argv.slice(2);
const run = commands.get(command);

if (run === undefined) {
	console.error(`${copy_error_prefix}: ${copy_error_unknown_command}: ${command} (${[...commands.keys()].join(", ")})`);
	process.exit(1);
}

/**
 * 글꼴 두 가족. 빌드 때 받아 결과 폴더에 넣으므로 읽는 사람은 CDN 에 닿지 않는다. 처음 빌드 한 번만 네트워크가 필요하고 cacheDir 에 남는다.
 * 코드 글꼴에 없는 한글이 본문 글꼴로 떨어지는 것은 token.css 가 잇는다.
 * 공급자마다 options 타입이 달라 defineConfig 처럼 공급자 목록을 타입에 넘긴다
 */
const fonts: AstroUserConfig<
	never,
	never,
	[ReturnType<typeof fontProviders.npm>, ReturnType<typeof fontProviders.fontsource>]
>["fonts"] = [
	{
		provider: fontProviders.npm(),
		name: "Pretendard Variable",
		cssVariable: font_css_variable_sans,
		options: {
			package: "pretendard",
			// ponytail: unifont 의 npm 공급자는 CSS 속 상대 경로 (./woff2-dynamic-subset/…) 를 CSS 파일 자리가 아니라 패키지 뿌리에서 푼다.
			// 그래서 CSS 가 든 폴더를 버전 뒤에 이어 뿌리를 그 폴더로 옮긴다. unifont 가 고쳐지면 version 은 "1.3.9", file 은 "dist/web/variable/…" 로 되돌린다
			version: "1.3.9/dist/web/variable",
			file: "pretendardvariable-dynamic-subset.css",
		},
		// 마지막이 generic 이라 Astro 가 라틴 글자의 폭을 맞춘 대체 글꼴을 함께 만든다
		fallbacks: ["system-ui", "Apple SD Gothic Neo", "sans-serif"],
	},
	{
		provider: fontProviders.fontsource(),
		name: "JetBrains Mono",
		cssVariable: font_css_variable_mono,
		// 가변 글꼴 파일 하나가 이 범위를 다 낸다
		weights: ["100 800"],
		styles: ["normal"],
		// 대체 글꼴은 token.css 가 본문 글꼴로 잇는다
		fallbacks: [],
	},
];

// 이 파일은 dist/cli.js 로 묶여 돈다. 거기서 한 칸 올라가면 패키지 뿌리다
const kitRoot = fileURLToPath(new URL("../", import.meta.url));
const srcDir = join(kitRoot, "src");
const docsRoot = resolve(docsDir);
const configFile = join(docsRoot, cli_config_file_name);
const siteConfig = siteConfigSchema.parse(
	existsSync(configFile) ? (await import(pathToFileURL(configFile).href)).default : site_config_absent,
);

// 빌드는 쪽을 미리 그리는 번들 (.prerender) 을 결과 폴더가 지금 폴더 안이면 그 안에, 밖이면 지금 폴더의 .astro 에 쓰고,
// 그 번들이 react 같은 의존성을 제자리에서 찾는다. 지금 폴더를 이 패키지로 옮겨 그 번들이 이 패키지 안에 생기게 한다
process.chdir(kitRoot);

await run({
	// Vite 는 astro, @astrojs/react 같은 이름을 root 에서 찾는다. pnpm 은 이 패키지의 의존성을 이 패키지 옆에만 두므로
	// root 를 문서 폴더가 아니라 이 패키지로 잡는다. 문서 폴더가 쓰는 자리 (공개 파일, 결과, 캐시) 는 아래에서 따로 준다
	root: kitRoot,
	srcDir,
	publicDir: join(docsRoot, "public"),
	outDir: join(docsRoot, "dist"),
	cacheDir: join(docsRoot, "node_modules", ".for-humanity"),
	configFile: false,
	// 링크에 마우스를 올리거나 포커스가 가면 그 쪽을 미리 받는다. 쪽이 정적 HTML 이라 비용이 작다
	prefetch: {prefetchAll: true},
	// AstroInlineConfig 의 fonts 는 공급자마다 다른 options 타입을 몰라, 위에서 공급자 타입으로 검사한 값을 넓혀 넘긴다
	fonts: fonts as AstroInlineConfig["fonts"],
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
					options.addDevToolbarApp({
						id: toolbar_app_id,
						name: copy_toolbar_name,
						icon: "file-search",
						entrypoint: join(srcDir, "toolbar/app.ts"),
					});
				},
				// dev toolbar 의 문서 검사 앱이 결과를 달라고 하면 모아 둔 줄을 다 보낸다
				"astro:server:setup": ({toolbar}) => {
					toolbar.on(toolbar_report_event, () => toolbar.send(toolbar_report_event, [...report.values()].flat()));
				},
			},
		},
	],
	markdown: {
		// 코드 색은 token.css 의 --app-code-* 가 정한다. Shiki 는 그 변수 이름만 inline style 로 적는다
		syntaxHighlight: "shiki",
		shikiConfig: {theme: createCssVariablesTheme({name: "for-humanity", variablePrefix: "--app-code-"})},
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
				[remarkReport, {root: docsRoot}],
			],
			rehypePlugins: [[rehypeHead, {title: siteConfig.title}], rehypeSections, rehypeTables],
		}),
	},
	vite: {
		resolve: {alias: [{find: /^@\//, replacement: `${srcDir}/`}]},
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

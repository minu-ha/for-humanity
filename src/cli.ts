#!/usr/bin/env node
/*
 * for-humanity <dev|build|preview> [문서 폴더]
 * 문서 폴더의 for-humanity.config.mjs 를 읽고 Markdown 을 그려 Hono 앱에 싣는다. 폴더를 빼면 지금 폴더다.
 * build 는 쪽마다 HTML 을 쓰고 자원 (CSS, 스크립트, 글꼴, 아이콘) 을 복사한다. dev 는 같은 앱을 띄우고 문서가 바뀌면 쪽을 다시 연다.
 * preview 는 만든 결과 폴더를 그대로 띄운다. 앱 (쪽, 컴포넌트, 스타일) 은 이 패키지의 src 에 있고, 문서 폴더에는 Markdown 과 설정만 있다
 */

import {EventEmitter} from "node:events";
import {existsSync, watch} from "node:fs";
import {copyFile, mkdir, writeFile} from "node:fs/promises";
import {dirname, join, relative, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {Hono} from "hono";
import {toSSG} from "hono/ssg";
import {createApp} from "@/app";
import {
	asset_client_path,
	asset_favicon_path,
	asset_font_dir,
	asset_island_path,
	asset_style_path,
} from "@/constant/asset";
import {cli_config_file_name, cli_default_command, cli_default_docs_dir, cli_dev_port} from "@/constant/cli";
import {copy_error_config, copy_error_prefix, copy_error_unknown_command} from "@/constant/copy";
import {
	font_css_variable_mono,
	font_css_variable_sans,
	font_mono_css,
	font_mono_family,
	font_mono_subset,
	font_sans_css,
	font_sans_fallbacks,
	font_sans_family,
} from "@/constant/font";
import {site_config_absent} from "@/constant/site";
import {createProcessor} from "@/content/create-processor";
import {readDocs} from "@/content/read-docs";
import {createDevApp} from "@/dev";
import {siteConfigSchema} from "@/type/site-config";
import {toFontCss} from "@/util/font/to-font-css";

const commands = ["dev", "build", "preview"];
const [command = cli_default_command, docsDir = cli_default_docs_dir] = process.argv.slice(2);

/**
 * 명령 본문. 오류는 아래 catch 가 한 줄로 적고 1 로 끝낸다
 */
const main = async () => {
	if (!commands.includes(command)) {
		throw new Error(`${copy_error_unknown_command}: ${command} (${commands.join(", ")})`);
	}

	// 이 파일은 dist/cli.js 로 묶여 돈다. 거기서 한 칸 올라가면 패키지 뿌리다
	const kitRoot = fileURLToPath(new URL("../", import.meta.url));
	const docsRoot = resolve(docsDir);
	const outDir = join(docsRoot, "dist");

	if (command === "preview") {
		const app = new Hono();

		app.use("/*", serveStatic({root: relative(process.cwd(), outDir)}));
		serve({fetch: app.fetch, port: cli_dev_port}, (info) => console.log(`http://localhost:${info.port}/`));

		return;
	}

	const configFile = join(docsRoot, cli_config_file_name);
	const parsedConfig = siteConfigSchema.safeParse(
		existsSync(configFile) ? (await import(pathToFileURL(configFile).href)).default : site_config_absent,
	);

	if (!parsedConfig.success) {
		throw new Error(
			`${copy_error_config}: ${parsedConfig.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join(", ")}`,
		);
	}

	const siteConfig = parsedConfig.data;
	// 본문 글꼴은 글자 조각 92개, 코드 글꼴은 라틴 한 파일이다. 변수 두 개는 token.css 가 받아 --app-font-* 를 만든다
	const sans = toFontCss({css: font_sans_css, fontDir: asset_font_dir});
	const mono = toFontCss({css: font_mono_css, keep: font_mono_subset, fontDir: asset_font_dir});
	const fontCss = [
		sans.css,
		mono.css,
		`:root{${font_css_variable_sans}:${[font_sans_family, ...font_sans_fallbacks].map((family) => JSON.stringify(family)).join(",")};${font_css_variable_mono}:${JSON.stringify(font_mono_family)}}`,
	].join("\n");
	const files = new Map([
		[asset_style_path, join(kitRoot, "dist/cli.css")],
		[asset_client_path, join(kitRoot, "dist/client.js")],
		[asset_island_path, join(kitRoot, "dist/island.js")],
		[asset_favicon_path, join(kitRoot, "src/asset/favicon.svg")],
		...sans.files,
		...mono.files,
	]);
	const processor = createProcessor({site: siteConfig, root: docsRoot});
	const store = {docs: await readDocs({root: docsRoot, processor})};
	const app = createApp({
		site: siteConfig,
		store,
		assets: {fontCss, preload: [...mono.files.keys()], reload: command === "dev"},
	});

	if (command === "build") {
		const result = await toSSG(app, {writeFile, mkdir}, {dir: outDir});

		if (!result.success) {
			throw result.error;
		}

		for (const [url, file] of files) {
			await mkdir(dirname(join(outDir, url)), {recursive: true});
			await copyFile(file, join(outDir, url));
		}

		console.log(`${result.files.length} pages, ${files.size} assets → ${relative(process.cwd(), outDir)}`);

		return;
	}

	const reload = new EventEmitter();

	serve({fetch: createDevApp({pages: app, files, reload}).fetch, port: cli_dev_port}, (info) =>
		console.log(`http://localhost:${info.port}/`),
	);

	/**
	 * 문서가 바뀌면 모두 다시 그리고 열린 쪽에 알린다. 그리다 멈추면 (머리말 오류 등) 까닭을 적고 이전 문서를 그대로 둔다
	 */
	const handleDocsChange = async (_event: string, filename: string | null) => {
		if (filename === null || !/\.mdx?$/.test(filename)) {
			return;
		}

		try {
			store.docs = await readDocs({root: docsRoot, processor});
			reload.emit("change");
		} catch (error) {
			console.error(`${copy_error_prefix}: ${error instanceof Error ? error.message : String(error)}`);
		}
	};

	watch(docsRoot, {recursive: true}, handleDocsChange);
};

try {
	await main();
} catch (error) {
	console.error(`${copy_error_prefix}: ${error instanceof Error ? error.message : String(error)}`);
	process.exit(1);
}

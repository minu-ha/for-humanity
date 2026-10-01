#!/usr/bin/env node
/*
 * CLI · for-humanity <dev|build|preview> [문서 폴더]
 * 기본 문서 폴더: 현재 폴더 · 출력: <문서 폴더>/dist
 */

import {EventEmitter} from "node:events";
import {existsSync, watch} from "node:fs";
import {copyFile, mkdir, rm, writeFile} from "node:fs/promises";
import {dirname, join, relative, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {Hono} from "hono";
import {toSSG} from "hono/ssg";
import {createApp} from "@/app";
import {asset_client_path, asset_favicon_path, asset_font_dir, asset_style_path} from "@/constant/asset";
import {cli_config_file_name, cli_default_command, cli_default_docs_dir, cli_dev_port} from "@/constant/cli";
import {copy_error_config, copy_error_prefix, copy_error_unknown_command} from "@/constant/copy";
import {font_mono_css, font_sans_css} from "@/constant/font";
import {site_config_absent} from "@/constant/site";
import {createProcessor} from "@/content/create-processor";
import {readDocs} from "@/content/read-docs";
import {createDevApp} from "@/dev";
import {siteConfigSchema} from "@/type/site-config";
import {toErrorMessage} from "@/util/error/to-error-message";
import {toFontCss} from "@/util/font/to-font-css";

const commands = ["dev", "build", "preview"];
const [command = cli_default_command, docsDir = cli_default_docs_dir] = process.argv.slice(2);

/**
 * 명령 실행 · 설정 검증, 렌더링, 빌드·서버 시작
 * 실패: 터미널 오류와 종료 코드 1
 */
const main = async () => {
    if (!commands.includes(command)) {
        throw new Error(`${copy_error_unknown_command}: ${command} (${commands.join(", ")})`);
    }

    // dist/cli.js 기준 패키지 루트
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
    const parsedConfig = siteConfigSchema.safeParse(existsSync(configFile) ? (await import(pathToFileURL(configFile).href)).default : site_config_absent);

    if (!parsedConfig.success) {
        throw new Error(`${copy_error_config}: ${parsedConfig.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join(", ")}`);
    }

    const siteConfig = parsedConfig.data;
    // 내장 @font-face와 파일 수집 · font-family는 token.css 소유
    const sans = toFontCss({css: join(kitRoot, font_sans_css), fontDir: asset_font_dir});
    const mono = toFontCss({css: join(kitRoot, font_mono_css), fontDir: asset_font_dir});
    const fontCss = [sans.css, mono.css].join("\n");
    const files = new Map([
        [asset_style_path, join(kitRoot, "dist/cli.css")],
        [asset_client_path, join(kitRoot, "dist/client.js")],
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
        // 삭제된 문서·자원의 잔여 파일 방지
        await rm(outDir, {recursive: true, force: true});

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
    let generation = 0;

    serve({fetch: createDevApp({pages: app, files, reload}).fetch, port: cli_dev_port}, (info) => console.log(`http://localhost:${info.port}/`));

    /**
     * Markdown 변경 시 전체 재처리와 새로고침
     * 재처리 실패 시 직전 정상 문서 유지
     */
    const handleDocsChange = async (_event: string, filename: string | null) => {
        if (filename !== null && !/\.mdx?$/.test(filename)) {
            return;
        }

        const currentGeneration = ++generation;

        try {
            const docs = await readDocs({root: docsRoot, processor});

            // 최신 변경의 처리 결과만 반영
            if (currentGeneration !== generation) {
                return;
            }

            store.docs = docs;
            reload.emit("change");
        } catch (error) {
            console.error(`${copy_error_prefix}: ${toErrorMessage(error)}`);
        }
    };

    watch(docsRoot, {recursive: true}, handleDocsChange);
};

try {
    await main();
} catch (error) {
    console.error(`${copy_error_prefix}: ${toErrorMessage(error)}`);
    process.exit(1);
}

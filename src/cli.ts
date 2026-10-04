#!/usr/bin/env node
/*
 * CLI · for-humanity <dev|build|preview> [문서 폴더]
 * 기본 문서 폴더: 현재 폴더 · 출력: <문서 폴더>/dist
 */

import {EventEmitter} from "node:events";
import {existsSync, watch} from "node:fs";
import {copyFile, mkdir, rm, writeFile} from "node:fs/promises";
import {basename, dirname, extname, join, relative, resolve, sep} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {debounce} from "es-toolkit";
import {Hono} from "hono";
import {toSSG} from "hono/ssg";
import {createApp} from "@/app";
import {asset_client_path, asset_favicon_path, asset_font_dir, asset_media_extensions, asset_style_path} from "@/constant/asset";
import {cli_config_file_name, cli_default_command, cli_default_docs_dir, cli_dev_port, cli_reload_delay_ms} from "@/constant/cli";
import {copy_error_config, copy_error_font_preload, copy_error_prefix, copy_error_unknown_command} from "@/constant/copy";
import {font_brand_css, font_cache_control, font_mono_css, font_sans_css, font_sans_preload_file} from "@/constant/font";
import {site_config_absent} from "@/constant/site";
import {createProcessor} from "@/content/create-processor";
import {readDocs} from "@/content/read-docs";
import {readHome} from "@/content/read-home";
import {createDevApp} from "@/dev";
import {siteConfigSchema} from "@/type/site-config";
import {toChangeQueue} from "@/util/async/to-change-queue";
import {toErrorMessage} from "@/util/error/to-error-message";
import {toAssetPath} from "@/util/file/to-asset-path";
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

        app.use(
            "/*",
            serveStatic({
                root: relative(process.cwd(), outDir),
                onFound: (_path, c) => {
                    if (c.req.path.startsWith(`${asset_font_dir}/`)) {
                        c.header("Cache-Control", font_cache_control);
                    }
                },
            }),
        );
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
    const brand = toFontCss({css: join(kitRoot, font_brand_css), fontDir: asset_font_dir});
    const sansPreload = [...sans.files].find((entry) => basename(entry[1]) === font_sans_preload_file);

    if (sansPreload === undefined) {
        throw new Error(`${copy_error_font_preload}: ${font_sans_preload_file}`);
    }

    const fontCss = [sans.css, mono.css, brand.css].join("\n");
    const stylePath = toAssetPath({path: asset_style_path, file: join(kitRoot, "dist/cli.css")});
    const clientPath = toAssetPath({path: asset_client_path, file: join(kitRoot, "dist/client.js")});
    const kitFiles = new Map([
        [stylePath, join(kitRoot, "dist/cli.css")],
        [clientPath, join(kitRoot, "dist/client.js")],
        [asset_favicon_path, join(kitRoot, "src/asset/favicon.svg")],
        ...sans.files,
        ...mono.files,
        ...brand.files,
    ]);
    const files = new Map(kitFiles);
    const processor = createProcessor({site: siteConfig, root: docsRoot, files});
    const [docs, home] = await Promise.all([readDocs({root: docsRoot, processor}), readHome({root: docsRoot, processor})]);
    const store = {docs, home};
    const app = createApp({
        site: siteConfig,
        store,
        assets: {stylePath, clientPath, fontCss, preload: [...brand.files.keys(), sansPreload[0], ...mono.files.keys()], reload: command === "dev"},
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
     * 갱신은 하나씩 실행 · 연속 저장 합치기 · 최신 변경만 적용
     * 문서 수가 많아도 파일 이벤트마다 전체 렌더링이 동시에 쌓이지 않음
     */
    const reloadDocs = debounce(
        toChangeQueue({
            run: async () => {
                const currentGeneration = generation;
                const nextFiles = new Map(kitFiles);
                const nextProcessor = createProcessor({site: siteConfig, root: docsRoot, files: nextFiles});
                const [docs, home] = await Promise.all([readDocs({root: docsRoot, processor: nextProcessor}), readHome({root: docsRoot, processor: nextProcessor})]);

                if (currentGeneration !== generation) {
                    return;
                }

                files.clear();
                for (const entry of nextFiles) {
                    files.set(...entry);
                }
                store.docs = docs;
                store.home = home;
                reload.emit("change");
            },
            onError: (error) => console.error(`${copy_error_prefix}: ${toErrorMessage(error)}`),
        }),
        cli_reload_delay_ms,
    );

    /**
     * 입력 변경 감지 · 출력·설치 폴더 제외 · 누락 자원 추가도 다시 확인
     */
    const handleDocsChange = (_event: string, filename: string | null) => {
        if (filename !== null) {
            const segments = filename.split(sep);
            if (segments.includes("dist") || segments.includes("node_modules") || (!/\.mdx?$/i.test(filename) && !asset_media_extensions.has(extname(filename).toLowerCase()))) {
                return;
            }
        }
        generation += 1;
        reloadDocs();
    };

    watch(docsRoot, {recursive: true}, handleDocsChange);
};

try {
    await main();
} catch (error) {
    console.error(`${copy_error_prefix}: ${toErrorMessage(error)}`);
    process.exit(1);
}

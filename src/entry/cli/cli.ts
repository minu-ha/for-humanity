#!/usr/bin/env node

/*
 * CLI. for-humanity <dev|build|preview> [문서 폴더]
 * 기본 문서 폴더: 현재 폴더. 출력: <문서 폴더>/dist
 */

import {copyFile, mkdir, rm, writeFile} from "node:fs/promises";
import {dirname, join, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {toSSG} from "hono/ssg";
import {readSiteConfig} from "@/app/_function/read-site-config";
import {loadSite} from "@/app/load-site";
import {copy_error_prefix, copy_error_unknown_command} from "@/constant/copy";
import {cli_default_command, cli_default_docs_dir} from "@/entry/cli/_constant/cli";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";
import {toErrorMessage} from "@/util/error/to-error-message";

const commands = ["dev", "build", "preview"];
const [command = cli_default_command, docsDir = cli_default_docs_dir] = process.argv.slice(2);

/**
 * 명령 실행. 설정 검증, 렌더링, 빌드, 서버 시작
 *
 *   - 실패: 터미널 오류와 종료 코드 1
 */
const main = async () => {
    if (!commands.includes(command)) {
        throw new Error(`${copy_error_unknown_command}: ${command} (${commands.join(", ")})`);
    }

    // dist/cli.js 기준 패키지 루트
    const kitRoot = fileURLToPath(new URL("../", import.meta.url));
    const docsRoot = resolve(docsDir);
    const outDir = join(docsRoot, "dist");
    const siteConfig = await readSiteConfig(docsRoot);

    if (command === "preview") {
        const vite = await import("vite");
        const server = await vite.preview(toPreviewConfig({root: docsRoot, port: siteConfig.port}));
        server.printUrls();
        return;
    }

    if (command === "dev") {
        const dev = await import("@/entry/dev/start-dev-server");
        await dev.startDevServer({root: docsRoot, kitRoot, site: siteConfig, source: false});
        return;
    }

    const snapshot = await loadSite({root: docsRoot, kitRoot, site: siteConfig});

    // 삭제된 문서와 자원의 잔여 파일 방지
    await rm(outDir, {recursive: true, force: true});
    const result = await toSSG(snapshot.pages, {writeFile, mkdir}, {dir: outDir});
    if (!result.success) throw result.error;
    const crawling = snapshot.crawling === undefined ? undefined : await toSSG(snapshot.crawling, {writeFile, mkdir}, {dir: outDir});
    if (crawling?.success === false) throw crawling.error;

    for (const [url, file] of snapshot.files) {
        await mkdir(dirname(join(outDir, url)), {recursive: true});
        await copyFile(file, join(outDir, url));
    }
    console.log(
        `${crawling === undefined ? result.files.length : result.files.length + crawling.files.length} files, ${snapshot.files.size} assets → ${relative(process.cwd(), outDir)}`,
    );
};

try {
    await main();
} catch (error) {
    console.error(`${copy_error_prefix}: ${toErrorMessage(error)}`);
    process.exit(1);
}

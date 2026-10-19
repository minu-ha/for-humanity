import {copyFile, mkdir, rm, writeFile} from "node:fs/promises";
import {dirname, join, relative} from "node:path";
import {fileURLToPath} from "node:url";
import type {ParsedArgs} from "citty";
import {toSSG} from "hono/ssg";
import {readProject} from "@/app/_function/read-project";
import {loadSite} from "@/app/load-site";
import type {cli_docs_args} from "@/entry/cli/_constant/cli";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";
import {toErrorMessage} from "@/util/error/to-error-message";
import {logger} from "@/util/logger/logger";

/**
 * 사이트 명령 실행 입력
 */
interface CliCommandParams {
    /**
     * Citty가 선택한 사이트 명령
     */
    command: "dev" | "build" | "preview";

    /**
     * 기본 문서 경로를 적용한 Citty 인자
     */
    args: ParsedArgs<typeof cli_docs_args>;
}

/**
 * 사이트 명령 실행과 실패 시 종료 코드 1
 */
export const runSiteCommand = async (params: CliCommandParams) => {
    try {
        if (params.args._.length > 1) {
            throw new Error("프로젝트 폴더는 하나만 지정하세요");
        }

        // dist의 실행 청크 기준 패키지 루트
        const kitRoot = fileURLToPath(new URL("../", import.meta.url));
        const project = await readProject(params.args.dir);
        const outDir = join(project.root, "dist");

        if (params.command === "preview") {
            const vite = await import("vite");
            const server = await vite.preview(toPreviewConfig({root: project.root, port: project.site.port}));

            server.printUrls();

            return;
        }

        if (params.command === "dev") {
            const dev = await import("@/entry/dev/start-dev-server");

            await dev.startDevServer({root: project.root, kitRoot, site: project.site, source: false, includePrivate: true});

            return;
        }

        const snapshot = await loadSite({root: project.root, kitRoot, site: project.site});

        // 삭제된 문서와 자원의 잔여 파일 방지
        await rm(outDir, {recursive: true, force: true});

        const result = await toSSG(snapshot.pages, {writeFile, mkdir}, {dir: outDir});

        if (!result.success) {
            throw result.error;
        }

        const crawling = snapshot.crawling === undefined ? undefined : await toSSG(snapshot.crawling, {writeFile, mkdir}, {dir: outDir});

        if (crawling?.success === false) {
            throw crawling.error;
        }

        for (const [url, file] of snapshot.files) {
            await mkdir(dirname(join(outDir, url)), {recursive: true});
            await copyFile(file, join(outDir, url));
        }

        logger.success(
            `${crawling === undefined ? result.files.length : result.files.length + crawling.files.length} files, ${snapshot.files.size} assets → ${relative(process.cwd(), outDir)}`,
        );
    } catch (error) {
        logger.error(toErrorMessage(error));
        process.exitCode = 1;
    }
};

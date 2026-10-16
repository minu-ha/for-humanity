import {cp, mkdir, mkdtemp, realpath, rm, symlink, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {test as base} from "@playwright/test";
import {createLogger, createServer, mergeConfig, type ViteDevServer} from "vite";
import {toDevConfig} from "@/entry/dev/to-dev-config";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 파일 변경과 오류 복구를 관찰하는 개발 서버
 */
interface DevSite {
    /**
     * 케이스별 문서 루트
     */
    root: string;

    /**
     * 소스 변경 검사의 격리된 패키지 루트
     */
    kitRoot: string;

    /**
     * 실제 Vite 서버와 종료 수명
     */
    server: ViteDevServer;

    /**
     * 문서 갱신 실패 기록
     */
    errors: string[];
}

/**
 * 케이스별 문서와 서버 격리, 소스 검사는 저장소 복사본 사용
 */
export const test = base.extend<{source: boolean; devSite: DevSite}>({
    source: [false, {option: true}],
    devSite: async ({source}, use) => {
        const directory = await realpath(await mkdtemp(join(tmpdir(), "for-humanity-dev-")));
        const kitRoot = source ? join(directory, "kit") : resolve(".");

        // 저장소 개발과 같은 패키지 내부 문서 루트, Vite 허용 영역 안에서도 원본 차단 검증
        const root = source ? join(kitRoot, "docs") : join(directory, "docs");
        try {
            await mkdir(root, {recursive: true});
            await writeFile(join(root, "README.md"), "# Development home\n\nInitial content.\n");
            if (source) {
                for (const name of ["src", "dist", "package.json", "tsconfig.json"]) {
                    await cp(resolve(name), join(kitRoot, name), {recursive: true});
                }
                await symlink(resolve("node_modules"), join(kitRoot, "node_modules"), "junction");
            }
            const errors: string[] = [];
            const server = await createServer(
                mergeConfig(toDevConfig({root, kitRoot, site: siteConfigSchema.parse({}), source}), {
                    customLogger: {...createLogger("silent"), error: (message: string) => errors.push(message)},
                    server: {port: 0, host: "127.0.0.1"},
                }),
            ).catch((error: unknown) => {
                throw new Error(errors.join("\n"), {cause: error});
            });
            try {
                await server.listen();
                await use({root, kitRoot, server, errors});
            } finally {
                await server.close();
            }
        } finally {
            await rm(directory, {recursive: true, force: true});
        }
    },
    baseURL: async ({devSite}, use) => {
        const address = devSite.server.httpServer?.address();
        if (address === null || address === undefined || typeof address === "string") throw new Error("개발 서버의 테스트 포트가 없습니다");
        await use(`http://127.0.0.1:${address.port}`);
    },
});

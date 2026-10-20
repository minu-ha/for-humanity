import {cp, mkdir, mkdtemp, realpath, rm, symlink, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {test as base} from "@playwright/test";
import {createLogger, createServer, mergeConfig, type ViteDevServer} from "vite";
import {toDevConfig} from "@/entry/dev/to-dev-config";
import {type SiteConfig, siteConfigSchema} from "@/type/site-config";

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
 * 개발 서버 시나리오의 실행 모드와 사이트 입력
 */
interface DevFixture {
    /**
     * 저장소 소스 또는 설치 번들 실행
     */
    source: boolean;

    /**
     * 서버 시작 시 기본값을 적용할 설정
     */
    site: SiteConfig;

    /**
     * 테스트 종료 시 정리할 임시 사이트
     */
    devSite: DevSite;
}

/**
 * 케이스별 문서와 서버 격리, 소스 검사는 저장소 복사본 사용
 */
export const test = base.extend<DevFixture>({
    source: [false, {option: true}],
    site: [{}, {option: true}],
    devSite: async ({source, site}, use, testInfo) => {
        const directory = await realpath(await mkdtemp(join(tmpdir(), "for-humanity-dev-")));
        const kitRoot = source ? join(directory, "kit") : resolve(".");

        // 저장소 개발과 같은 패키지 내부 문서 루트, Vite 허용 영역 안에서도 원본 차단 검증
        const root = source ? join(kitRoot, "docs") : join(directory, "docs");

        try {
            await mkdir(join(root, "public"), {recursive: true});
            await writeFile(join(root, "README.md"), "# Development home\n\nInitial content.\n");

            if (source) {
                for (const name of ["src", "dist", "package.json", "tsconfig.json"]) {
                    await cp(resolve(name), join(kitRoot, name), {recursive: true});
                }

                await symlink(resolve("node_modules"), join(kitRoot, "node_modules"), "junction");
            }

            const errors: string[] = [];

            const server = await createServer(
                mergeConfig(toDevConfig({root, kitRoot, site: siteConfigSchema.parse(site), source, includePrivate: true}), {
                    // node_modules 링크를 공유해도 서버별 의존성 캐시는 격리
                    cacheDir: join(directory, ".vite"),
                    customLogger: {
                        ...createLogger("silent"),
                        error: (message: string) => {
                            errors.push(message);
                        },
                    },
                    server: {port: 0, host: "127.0.0.1"},
                }),
            ).catch((error: unknown) => {
                throw new Error(errors.join("\n"), {cause: error});
            });

            try {
                await server.listen();
                await use({root, kitRoot, server, errors});
            } finally {
                // 화면의 준비 오류 뒤에 숨은 원인을 실패 보고서에 보존
                if (testInfo.status !== testInfo.expectedStatus && errors.length > 0) {
                    await testInfo.attach("dev-server-errors", {body: errors.join("\n"), contentType: "text/plain"});
                }

                await server.close();
            }
        } finally {
            await rm(directory, {recursive: true, force: true});
        }
    },
    baseURL: async ({devSite}, use) => {
        const address = devSite.server.httpServer?.address();

        if (address === null || address === undefined || typeof address === "string") {
            throw new Error("개발 서버의 테스트 포트가 없습니다");
        }

        await use(`http://127.0.0.1:${address.port}`);
    },
});

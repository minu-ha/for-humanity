import {execFileSync} from "node:child_process";
import {cp, mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test as base} from "@playwright/test";
import {preview} from "vite";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 워커별 공식 문서 사이트. 저장소 content의 공개 입력을 임시 폴더에서 실제 CLI로 빌드
 */
export const test = base.extend<Record<never, never>, {docsSite: string; basePath: ResolvedSiteConfig["basePath"]}>({
    basePath: ["/", {option: true, scope: "worker"}],
    docsSite: [
        async ({basePath}, use) => {
            const root = await mkdtemp(join(tmpdir(), "for-humanity-docs-"));

            try {
                // 빌드 출력과 내부 문서 제외, 공개 문서와 공용 자료만 복사
                await cp("content", join(root, "content"), {recursive: true, filter: (source) => !/^content[\\/](?:dist|private)(?:[\\/]|$)/.test(source)});
                await cp("for-humanity.config.ts", join(root, "for-humanity.config.ts"));

                if (basePath !== "/") {
                    await writeFile(join(root, "for-humanity.config.ts"), `export default {title: "Project docs", basePath: ${JSON.stringify(basePath)}, cursorFace: true};\n`);
                }

                execFileSync(process.execPath, ["dist/cli.js", "build", root]);

                const server = await preview(toPreviewConfig({root: join(root, "content"), port: 0, host: "localhost", basePath}));

                try {
                    const url = server.resolvedUrls?.local[0];

                    if (url === undefined) {
                        throw new Error("미리보기 서버의 테스트 주소가 없습니다");
                    }

                    await use(new URL(url).origin);
                } finally {
                    await server.close();
                }
            } finally {
                await rm(root, {recursive: true, force: true});
            }
        },
        {scope: "worker"},
    ],
    baseURL: async ({docsSite}, use) => {
        await use(docsSite);
    },
});

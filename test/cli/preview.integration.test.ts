import {spawnSync} from "node:child_process";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {test as base} from "@test/_fixture/unit";
import {type PreviewServer, preview} from "vite";
import {describe, expect} from "vitest";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";

/**
 * 실제 HTTP 요청으로 확인하는 정적 미리보기
 */
interface PreviewFixture {
    /**
     * 케이스마다 시작하고 종료하는 Vite preview
     */
    previewServer: PreviewServer;

    /**
     * 운영체제가 배정한 로컬 접속 주소
     */
    previewUrl: string;
}

const test = base.extend<PreviewFixture>({
    previewServer: async ({root}, use) => {
        await mkdir(join(root, "dist/guide/nested"), {recursive: true});
        await mkdir(join(root, "dist/guide/file.html"));
        await mkdir(join(root, "dist/_fh/fonts"), {recursive: true});
        await writeFile(join(root, "dist/index.html"), "<!doctype html><h1>Built home</h1>");
        await writeFile(join(root, "dist/guide/nested/index.html"), "<!doctype html><h1>Nested document</h1>");
        await writeFile(join(root, "dist/guide/file.html/index.html"), "<!doctype html><h1>Nested document</h1>");
        await writeFile(join(root, "dist/_fh/fonts/sample.1234.woff2"), "font bytes");
        await writeFile(join(root, "dist/_fh/local image.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');
        await writeFile(join(root, "README.md"), "# Source home\n");
        await writeFile(join(root, "vite.config.ts"), 'throw new Error("Consumer Vite config must not run");\n');
        await writeFile(join(root, ".env.production"), "VITE_PREVIEW_PRIVATE=private-value\n");
        const server = await preview(toPreviewConfig({root, port: 0}));
        try {
            await use(server);
        } finally {
            await server.close();
        }
    },
    previewUrl: async ({previewServer}, use) => {
        const url = previewServer.resolvedUrls?.local[0];
        if (url === undefined) throw new Error("미리보기 서버의 테스트 주소가 없습니다");
        await use(url);
    },
});

describe("정적 미리보기", () => {
    test("빌드 결과가 없으면 서버를 시작하지 않고 빌드 안내와 종료 코드 1을 반환한다", ({root}) => {
        /**
         * WHEN
         * 실제 CLI의 미리보기 실행
         */
        const result = spawnSync(process.execPath, ["dist/cli.js", "preview", root], {encoding: "utf8", timeout: 5000});

        /**
         * THEN
         * HTTP 서버 대기 대신 명시적 실패와 다음 명령 안내
         */
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("build");
    });

    test("홈과 중첩 문서의 직접 접속에서 빌드한 HTML을 그대로 반환한다", async ({previewUrl, previewServer, root}) => {
        /**
         * WHEN
         * 홈, 중첩 경로, index.html 직접 요청
         */
        const responses = await Promise.all(["/", "/guide/nested/", "/guide/nested/index.html"].map((path) => fetch(new URL(path, previewUrl))));

        /**
         * THEN
         * 소비 프로젝트의 Vite 설정 실행과 개발 스크립트 삽입 없이 원본 출력 유지
         */
        expect(responses.map((response) => response.status)).toStrictEqual([200, 200, 200]);
        expect(previewServer.config.env).not.toHaveProperty("VITE_PREVIEW_PRIVATE");
        expect(await responses[0].text()).toBe(await readFile(join(root, "dist/index.html"), "utf8"));
        for (const response of responses.slice(1)) {
            expect(await response.text()).toBe(await readFile(join(root, "dist/guide/nested/index.html"), "utf8"));
        }
    });

    test("없는 경로와 문서 원본 요청은 홈 화면으로 대체하지 않고 404를 반환한다", async ({previewUrl}) => {
        /**
         * WHEN
         * 없는 문서, 원본, 설정, 환경 파일과 개발 전용 URL 요청
         */
        const responses = await Promise.all(
            ["/missing/", "/README.md", "/vite.config.ts", "/.env.production", "/@vite/client", "/_fh/fonts/missing.woff2"].map((path) =>
                fetch(new URL(path, previewUrl), {headers: {Accept: "text/html"}}),
            ),
        );

        /**
         * THEN
         * 모든 요청 거부, 없는 폰트의 장기 캐시 방지
         */
        expect(responses.map((response) => response.status)).toStrictEqual([404, 404, 404, 404, 404, 404]);
        for (const response of responses) {
            expect(response.headers.get("cache-control")).toBeNull();
            expect(await response.text()).not.toContain("Built home");
        }
    });

    test("끝 슬래시가 없거나 점이 있는 문서 주소도 같은 빌드 결과를 반환한다", async ({previewUrl, root}) => {
        /**
         * WHEN
         * 끝 슬래시 없이 query를 포함한 문서 요청
         */
        const responses = await Promise.all(["/guide/nested?view=preview", "/guide/file.html?view=preview"].map((path) => fetch(new URL(path, previewUrl))));

        /**
         * THEN
         * 기존 정적 서버의 폴더 index.html 조회 유지
         */
        expect(responses.map((response) => response.status)).toStrictEqual([200, 200]);
        for (const response of responses) {
            expect(await response.text()).toBe(await readFile(join(root, "dist/guide/nested/index.html"), "utf8"));
        }
    });

    test("폰트의 장기 캐시와 공백이 있는 자원의 URL 인코딩을 유지한다", async ({previewUrl}) => {
        /**
         * WHEN
         * 폰트 본문, HEAD와 인코딩한 이미지 요청
         */
        const font = await fetch(new URL("/_fh/fonts/sample.1234.woff2", previewUrl));
        const head = await fetch(new URL("/_fh/fonts/sample.1234.woff2", previewUrl), {method: "HEAD"});
        const image = await fetch(new URL("/_fh/local%20image.svg", previewUrl));

        /**
         * THEN
         * 폰트 본문과 캐시 계약, HEAD의 빈 본문, SVG 형식 보존
         */
        expect(font.status).toBe(200);
        expect(font.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
        expect(await font.text()).toBe("font bytes");
        expect(head.status).toBe(200);
        expect(head.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
        expect(await head.text()).toBe("");
        expect(image.status).toBe(200);
        expect(image.headers.get("content-type")).toContain("image/svg+xml");
    });

    test("원본 문서를 수정해도 미리보기는 마지막 빌드 결과를 제공한다", async ({previewUrl, root}) => {
        /**
         * GIVEN
         * 빌드 이후 수정한 원본 문서
         */
        await writeFile(join(root, "README.md"), "# Changed after build\n");

        /**
         * WHEN
         * 미리보기 홈 요청
         */
        const response = await fetch(previewUrl);

        /**
         * THEN
         * 원본 재처리 없이 빌드 결과 유지
         */
        expect(await response.text()).toBe("<!doctype html><h1>Built home</h1>");
    });

    test("설정 포트가 사용 중이면 다른 포트로 옮기지 않고 종료 코드 1을 반환한다", async ({previewUrl, root}) => {
        /**
         * GIVEN
         * 이미 실행 중인 미리보기와 같은 포트의 사이트 설정
         */
        await writeFile(join(root, "for-humanity.config.ts"), `export default {port: ${new URL(previewUrl).port}};\n`);

        /**
         * WHEN
         * 소비자 폴더에서 실제 CLI로 두 번째 미리보기 실행
         */
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "preview", "."], {cwd: root, encoding: "utf8", timeout: 5000});

        /**
         * THEN
         * 다른 포트 자동 선택 없이 충돌 오류 반환
         */
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("already in use");
    });
});

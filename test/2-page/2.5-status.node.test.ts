import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {jsx} from "hono/jsx/jsx-runtime";
import {describe, expect} from "vitest";
import {toHtml} from "@/app/_function/to-html";
import {loadSite} from "@/app/load-site";
import {PgStatus} from "@/page/status/pg-status";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 상태 화면의 HTTP 응답, 이미지와 정적 출력(src/app/load-site.ts) 검증
 */
describe("상태 화면", () => {
    describe("없는 문서", () => {
        test("[STA-001] 없는 문서는 배포 경로의 홈 링크와 검색 제외 안내를 포함한 404 화면을 반환한다", async ({scope}) => {
            /**
             * GIVEN
             * 하위 경로에 배포하는 문서 사이트
             */
            const snapshot = await loadSite({root: scope.root, kitRoot: resolve("."), site: siteConfigSchema.parse({basePath: "/project/", title: "Team notes"})});

            /**
             * WHEN
             * 없는 중첩 문서 요청
             */
            const response = await snapshot.app.request("/missing/nested/");
            const html = await response.text();

            /**
             * THEN
             * 실제 404 상태와 배포 경로를 유지하는 독립 화면
             */
            expect(response.status).toBe(404);
            expect(typeof snapshot.notFound).toBe("string");
            expect(response.headers.get("content-type")).toContain("text/html");
            expect(html).toContain("Page not found");
            expect(html).toContain("Team notes");
            expect(html).toMatch(/name="robots" content="noindex/);
            expect(html).toContain('href="/project/"');
            expect(html).not.toContain("fh-navigation-data");
        });
    });

    describe("이미지 교체", () => {
        test("[STA-002] 사용자 상태 이미지는 공개 주소 설정 없이도 배포 경로가 붙은 내용 지문 자원으로 제공한다", async ({scope}) => {
            /**
             * GIVEN
             * 문서 루트의 사용자 SVG와 이미지 설정
             */
            await mkdir(join(scope.root, "asset"));
            const file = join(scope.root, "asset/status.svg");
            await writeFile(file, '<svg xmlns="http://www.w3.org/2000/svg"><title>Custom status face</title></svg>');

            /**
             * WHEN
             * 사용자 이미지가 있는 사이트의 없는 문서 요청
             */
            const snapshot = await loadSite({root: scope.root, kitRoot: resolve("."), site: siteConfigSchema.parse({basePath: "/project/", statusImage: "asset/status.svg"})});
            const response = await snapshot.app.request("/missing/");
            const html = await response.text();
            const image = [...snapshot.files].find((entry) => entry[1] === file)?.[0];

            /**
             * THEN
             * 사용자 이미지의 내용 지문 URL과 배포 목록
             */
            expect(image).toMatch(/^\/_fh\/media\/asset\.[a-f0-9]+\.svg$/);
            expect(html).toContain(`src="/project${image}"`);
        });

        test("[STA-003] 상태 이미지는 내부 파일을 공개 결과로 배포할 수 없다", async ({scope}) => {
            /**
             * GIVEN
             * 내부 문서 폴더를 가리키는 이미지 설정
             */
            await mkdir(scope.privateRoot);
            await writeFile(join(scope.privateRoot, "face.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');

            /**
             * WHEN
             * 공개 사이트 준비
             */
            const result = loadSite({root: scope.root, kitRoot: resolve("."), site: siteConfigSchema.parse({statusImage: "private/face.svg"})});

            /**
             * THEN
             * 내부 자원 공개 차단
             */
            await expect(result).rejects.toThrow(/Public documents cannot reference private files/);
        });
    });

    describe("정적 출력", () => {
        test("[STA-004] 기본 빌드는 호스팅과 무관하게 설정을 반영한 404 파일을 생성한다", {timeout: 45000}, async ({root}) => {
            /**
             * GIVEN
             * 하위 경로에 배포하는 최소 프로젝트
             */
            await mkdir(join(root, "content/public"), {recursive: true});
            await writeFile(join(root, "content/README.md"), "# Home");
            await writeFile(join(root, "for-humanity.config.mjs"), 'export default {basePath: "/project/", title: "Team notes"};');

            /**
             * WHEN
             * 실제 CLI의 정적 빌드
             */
            const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "build", root], {encoding: "utf8"});
            const file = join(root, "content/dist/404.html");
            const html = existsSync(file) ? await readFile(file, "utf8") : undefined;

            /**
             * THEN
             * 사용자 설정과 홈 복귀 경로를 포함한 정적 오류 화면
             */
            expect(result.status, result.stderr).toBe(0);
            expect(html).toContain("Page not found");
            expect(html).toContain("Team notes");
            expect(html).toContain('href="/project/"');
        });
    });

    describe("다른 상태의 재사용", () => {
        test("[STA-005] 같은 상태 화면은 번호, 안내, 이미지와 복귀 링크를 교체할 수 있다", async () => {
            /**
             * GIVEN
             * 다른 이미지와 복귀 경로를 사용하는 점검 안내
             */
            const status = {
                code: "503",
                title: "Temporarily unavailable",
                description: "Please try again later.",
                image: "/maintenance.svg",
                action: {href: "/help/", label: "Get help"},
            };

            /**
             * WHEN
             * 공통 상태 문서 렌더
             */
            const html = await toHtml(
                jsx(PgStatus, {
                    site: siteConfigSchema.parse({title: "Team notes"}),
                    assets: {stylePaths: [], fontCss: "", preload: [], browser: {kind: "inline", code: ""}},
                    status,
                }),
            );

            /**
             * THEN
             * 전달한 상태와 이미지, 행동의 독립 표시
             */
            expect(String(html)).toContain("503 Temporarily unavailable | Team notes");
            expect(String(html)).toContain('src="/maintenance.svg"');
            expect(String(html)).toContain('href="/help/"');
            expect(String(html)).toContain("Get help");
            expect(String(html)).not.toContain("Page not found");
        });

        test("[STA-006] 404 출력 파일과 충돌하는 문서 경로는 준비 전에 거부한다", async ({scope}) => {
            /**
             * GIVEN
             * 정적 오류 파일 이름을 사용하는 문서
             */
            await writeFile(join(scope.publicRoot, "404.html.md"), "---\nname: Reserved\nlabel: Reserved\ngroup: Guide\n---\n\nReserved");

            /**
             * WHEN
             * 문서 사이트 준비
             */
            const result = loadSite({root: scope.root, kitRoot: resolve("."), site: siteConfigSchema.parse({})});

            /**
             * THEN
             * 출력 폴더와 정적 오류 파일의 충돌 차단
             */
            await expect(result).rejects.toThrow(/Path cannot be used as a document id/);
        });
    });
});

import {mkdir, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {loadSite} from "@/app/load-site";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

/**
 * README 홈(src/app/_function/read-home.ts, src/page/home) 검증
 */
describe("홈", () => {
    describe("README 홈", () => {
        test("[HOM-001] 루트 README는 홈으로 렌더하고 중첩 문서의 홈 링크를 해석한다", async ({scope}) => {
            /**
             * GIVEN
             * 루트 README와 홈으로 연결하는 중첩 문서
             */
            const site = siteConfigSchema.parse({});
            const processor = toProcessor({site, scope});

            await mkdir(join(scope.publicRoot, "guide"));

            await Promise.all([
                writeFile(
                    join(scope.root, "readme.md"),
                    '<div align="center">\n\n<img src="/favicon.svg" width="96" height="96" alt="Library face">\n\n# My library\n\nWelcome home.\n\n</div>\n\n## Start\n\n[Guide](public/guide/setup.md)\n\n```js\nconst ready = true;\n```\n',
                ),
                writeFile(join(scope.publicRoot, "guide/setup.md"), "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---\n\n[Home](../../readme.md#start)\n\n## Details\n"),
            ]);

            /**
             * WHEN
             * 홈 렌더와 /readme/ 요청
             */
            const [docs, home] = await Promise.all([readDocs({scope, processor}), readHome({dir: scope.root, scope, processor})]);

            const app = toPageApp({
                site,
                store: {docs, homes: new Map(home === undefined ? [] : [[undefined, home] as const])},
                assets: {stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
            });

            const response = await app.request("/");
            const html = await response.text();
            const readme = await app.request("/readme/");

            /**
             * THEN
             * README 본문의 홈, 중첩 문서의 홈 링크, /readme/의 404 응답
             */
            expect(response.status).toBe(200);
            expect(docs.map((doc) => doc.id)).toStrictEqual(["guide/setup"]);
            expect(html).toMatch(/<h1[^>]*><span[^>]*>My library<\/span><\/h1>/);
            expect(html).toMatch(/Welcome home\./);
            expect(html).toMatch(/<div align="center">/);
            expect(html).toMatch(/src="\/favicon\.svg" width="96" height="96"/);
            expect(html).toContain('<a href="/guide/setup/">Guide</a>');
            expect(html).toMatch(/href="#start" data-toc-link/);
            expect(html).toMatch(/class="shiki/);
            expect(html).toMatch(/wg_sidebar__brand" href="\/" aria-current="page"/);
            expect([...html.matchAll(/href="\/"/g)].length).toBe(1);
            expect(docs[0].html).toMatch(/href="\/#start"/);
            expect(html).not.toMatch(/wg_article__eyebrow|pg_home__card/);
            expect(readme.status).toBe(404);
        });

        test("[HOM-002] README가 없으면 홈페이지 작성 안내를 표시한다", async ({scope}) => {
            /**
             * GIVEN
             * README가 없는 문서 루트
             */
            const site = siteConfigSchema.parse({});

            /**
             * WHEN
             * 홈 렌더
             */
            const home = await readHome({dir: scope.root, scope, processor: toProcessor({site, scope})});

            const app = toPageApp({
                site,
                store: {docs: [], homes: new Map(home === undefined ? [] : [[undefined, home] as const])},
                assets: {stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
            });

            const html = await (await app.request("/")).text();

            /**
             * THEN
             * 홈 작성 안내
             */
            expect(home).toBe(undefined);
            expect(html).toMatch(/문서 폴더에 README\.md를 추가/);
            expect(html).not.toMatch(/pg_home__card|>Overview<|>Documents</);
        });

        test("[HOM-003] 번역 폴더의 README는 /<code>/ 홈으로 렌더하고 언어별 lang과 설명을 쓴다", async ({scope}) => {
            /**
             * GIVEN
             * 영어 홈과 한국어 README, 언어별 설명, README가 없는 세 번째 언어
             */
            const site = siteConfigSchema.parse({lang: "en", description: "English notes", locales: {ko: {description: "한국어 안내"}, ja: {}}});

            await mkdir(join(scope.root, "ko"));

            await Promise.all([writeFile(join(scope.root, "README.md"), "# Home\n\nWelcome.\n"), writeFile(join(scope.root, "ko/README.md"), "# 홈\n\n[English](../README.md)\n")]);

            /**
             * WHEN
             * 사이트 로드와 세 홈 요청
             */
            const siteApp = await loadSite({root: scope.root, kitRoot: resolve("."), site});
            const [home, korean, japanese] = await Promise.all(["/", "/ko/", "/ja/"].map(async (path) => (await siteApp.app.request(path)).text()));

            /**
             * THEN
             * 언어별 lang과 설명, 번역 홈의 영어 홈 링크와 현재 페이지인 사이트 이름, README 없는 언어의 작성 안내
             */
            expect(home).toContain('<html lang="en"');
            expect(home).toContain('name="description" content="English notes"');
            expect(home).toMatch(/Welcome\./);
            expect(korean).toContain('<html lang="ko"');
            expect(korean).toContain('name="description" content="한국어 안내"');
            expect(korean).toContain('<a href="/">English</a>');
            expect(korean).toMatch(/wg_sidebar__brand" href="\/ko\/" aria-current="page"/);
            expect(japanese).toContain('<html lang="ja"');
            expect(japanese).not.toContain('name="description"');
            expect(japanese).toMatch(/문서 폴더에 README\.md를 추가/);
        });
    });
});

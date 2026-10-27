import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {toSSG} from "hono/ssg";
import {describe, expect} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {toCrawlingApp} from "@/app/_function/to-crawling-app";
import {toHttpApp} from "@/app/_function/to-http-app";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 크롤러 파일(src/app/_function/to-crawling-app.ts) 검증
 */
describe("크롤러 파일", () => {
    describe("응답", () => {
        test("[CRW-001] 공개 주소가 없으면 크롤러 파일을 제공하지 않는다", async () => {
            /**
             * GIVEN
             * 공개 주소가 없는 사이트
             */
            const site = siteConfigSchema.parse({});
            const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePaths: [asset_style_path]};
            const app = toHttpApp({pages: toPageApp({site, store: {docs: [], homes: new Map()}, assets}), files: new Map()});

            /**
             * WHEN
             * 크롤러 파일 요청
             */
            const robots = await app.request("/robots.txt");
            const sitemap = await app.request("/sitemap.xml");

            /**
             * THEN
             * 두 크롤러 파일의 404 응답
             */
            expect(robots.status).toBe(404);
            expect(sitemap.status).toBe(404);
        });

        test("[CRW-002] 크롤러 파일은 현재 문서 목록의 인코딩한 주소를 제공한다", async ({scope}) => {
            /**
             * GIVEN
             * 공개 주소와 한글 이름 문서가 있는 사이트
             */
            await mkdir(join(scope.publicRoot, "guide"));
            await writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Start\nlabel: Start\ngroup: Guide\n---\n\nStart here.\n");
            await writeFile(join(scope.publicRoot, "guide/한국어 & tools.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\nText.\n");

            const url = "https://docs.example.org";
            const site = siteConfigSchema.parse({url});

            /**
             * WHEN
             * 페이지와 크롤러 응답 생성, 개발 중 문서 삭제 후 사이트맵 재요청
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const store = {docs, homes: new Map()};
            const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePaths: [asset_style_path]};
            const app = toHttpApp({pages: toPageApp({site, store, assets}), crawling: toCrawlingApp({url, site, store}), files: new Map()});
            const robots = await app.request("/robots.txt");
            const sitemap = await app.request("/sitemap.xml");
            const xml = await sitemap.text();
            const guide = await app.request("/guide/");
            const nestedGuide = await app.request(`/guide/${encodeURIComponent("한국어 & tools")}/`);

            store.docs = [];

            const updated = await (await app.request("/sitemap.xml")).text();

            /**
             * THEN
             * 일반 문서 경로와 한글 인코딩한 사이트맵 주소 유지, 문서 삭제 뒤 홈 주소만 남은 사이트맵
             */
            expect(guide.status, "crawler routes must preserve ordinary document routes").toBe(200);
            expect(nestedGuide.status, "crawler routes must preserve nested document routes").toBe(200);
            expect(robots.status).toBe(200);
            expect(String(robots.headers.get("content-type"))).toMatch(/^text\/plain/);
            expect(await robots.text()).toBe("User-agent: *\nAllow: /\n\nSitemap: https://docs.example.org/sitemap.xml\n");
            expect(sitemap.status).toBe(200);
            expect(String(sitemap.headers.get("content-type"))).toMatch(/^application\/xml/);
            expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
            expect(xml).toMatch(/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml">/);
            expect(xml).toMatch(/<loc>https:\/\/docs\.example\.org\/<\/loc>/);
            expect(xml).toContain(`<loc>https://docs.example.org/guide/${encodeURIComponent("한국어 & tools")}/</loc>`);
            expect([...xml.matchAll(/<loc>/g)].length).toBe(3);
            expect(xml).not.toMatch(/<lastmod>|<changefreq>|<priority>|robots\.txt|sitemap\.xml|_fh|#read/);
            expect([...updated.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])).toStrictEqual(["https://docs.example.org/"]);
        });

        test("[CRW-007] 사이트맵 lastmod는 날까지 적은 마지막 머리말 날짜만 사용한다", async ({scope}) => {
            /**
             * GIVEN
             * 정리 날짜를 날까지 적은 문서, 처음 작성 날짜만 날까지 적은 문서, 정리 날짜를 달까지 적은 문서, 날짜 없는 문서
             */
            const url = "https://docs.example.org";
            const site = siteConfigSchema.parse({url});

            await Promise.all([
                writeFile(join(scope.publicRoot, "revised.md"), "---\nname: Revised\nlabel: Revised\ngroup: Posts\ncreated: 2022-12-01\nrevised: 2026-10-05\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "created.md"), "---\nname: Created\nlabel: Created\ngroup: Posts\ncreated: 2025-03-14\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "month.md"), "---\nname: Month\nlabel: Month\ngroup: Posts\ncreated: 2022-12-01\nrevised: 2026-10\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "plain.md"), "---\nname: Plain\nlabel: Plain\ngroup: Posts\n---\n\nText.\n"),
            ]);

            /**
             * WHEN
             * 사이트맵 요청과 주소별 lastmod 수집
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const xml = await (await toCrawlingApp({url, site, store: {docs, homes: new Map()}}).request("/sitemap.xml")).text();
            const lastmods = Object.fromEntries([...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map((match) => [match[1], match[2]]));

            /**
             * THEN
             * loc 바로 뒤의 정리 날짜와 처음 작성 날짜, 달까지만 적은 정리 날짜와 날짜 없는 문서, 홈의 lastmod 없음
             */
            expect(lastmods).toStrictEqual({
                [`${url}/`]: undefined,
                [`${url}/revised/`]: "2026-10-05",
                [`${url}/created/`]: "2025-03-14",
                [`${url}/month/`]: undefined,
                [`${url}/plain/`]: undefined,
            });
        });
    });

    describe("정적 빌드와 예약 경로", () => {
        test("[CRW-003] 정적 빌드는 크롤러 파일과 일반 문서 경로를 함께 생성한다", async ({scope}) => {
            /**
             * GIVEN
             * 공개 주소와 중첩 문서가 있는 사이트
             */
            await mkdir(join(scope.publicRoot, "guide"));
            await writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Start\nlabel: Start\ngroup: Guide\n---\n\nStart here.\n");
            await writeFile(join(scope.publicRoot, "guide/details.md"), "---\nname: Details\nlabel: Details\ngroup: Guide\n---\n\nNested details.\n");

            const url = "https://docs.example.org";
            const site = siteConfigSchema.parse({url});

            /**
             * WHEN
             * 페이지와 크롤러 파일의 정적 출력
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePaths: [asset_style_path]};
            const app = toPageApp({site, store: {docs, homes: new Map()}, assets});
            const result = await toSSG(app, {writeFile, mkdir}, {dir: scope.root});
            const crawlerResult = await toSSG(toCrawlingApp({url, site, store: {docs, homes: new Map()}}), {writeFile, mkdir}, {dir: scope.root});

            /**
             * THEN
             * 크롤러 파일과 일반 문서의 정적 파일
             */
            expect(result.success).toBe(true);
            expect(crawlerResult.success).toBe(true);
            expect(result.files.length + crawlerResult.files.length, "home, both documents and both crawler files must be emitted").toBe(5);
            expect(await readFile(join(scope.root, "guide/index.html"), "utf8")).toMatch(/Start here\./);
            expect(await readFile(join(scope.root, "guide/details/index.html"), "utf8")).toMatch(/Nested details\./);
            expect(await readFile(join(scope.root, "robots.txt"), "utf8")).toMatch(/Sitemap: https:\/\/docs\.example\.org\/sitemap\.xml/);
            expect(await readFile(join(scope.root, "sitemap.xml"), "utf8")).toMatch(/<loc>https:\/\/docs\.example\.org\/<\/loc>/);
        });

        test("[CRW-004] 공개 주소를 지정하면 크롤러 파일과 겹치는 문서 경로를 거부한다", async ({scope}) => {
            /**
             * GIVEN
             * 크롤러 파일 이름과 겹치는 문서 경로
             */
            await mkdir(join(scope.publicRoot, "sitemap.xml"));
            await writeFile(join(scope.publicRoot, "Robots.txt.md"), "---\nname: Robots\nlabel: Robots\ngroup: Guide\n---\n\nText.\n");
            await writeFile(join(scope.publicRoot, "sitemap.xml/guide.md"), "---\nname: Sitemap\nlabel: Sitemap\ngroup: Guide\n---\n\nText.\n");

            /**
             * WHEN
             * 크롤러 파일 경로를 예약한 문서 로드
             */
            const result = readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope}), reserved: ["robots.txt", "sitemap.xml"]});

            /**
             * THEN
             * 크롤러 예약 경로 거부
             */
            await expect(result).rejects.toThrow(/Path cannot be used as a document id/);
        });

        test("[CRW-005] 공개 주소가 없으면 크롤러 파일 이름의 문서 경로도 수집한다", async ({scope}) => {
            /**
             * GIVEN
             * 크롤러 파일 이름과 겹치는 문서 경로
             */
            await mkdir(join(scope.publicRoot, "sitemap.xml"));
            await writeFile(join(scope.publicRoot, "Robots.txt.md"), "---\nname: Robots\nlabel: Robots\ngroup: Guide\n---\n\nText.\n");
            await writeFile(join(scope.publicRoot, "sitemap.xml/guide.md"), "---\nname: Sitemap\nlabel: Sitemap\ngroup: Guide\n---\n\nText.\n");

            /**
             * WHEN
             * 예약 경로 없는 문서 로드
             */
            const result = readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope})});

            /**
             * THEN
             * 크롤러 파일 이름의 두 문서 수집
             */
            await expect(result).resolves.toHaveLength(2);
        });

        test("[CRW-006] 사이트맵은 번역 홈을 포함하고 번역이 둘 이상인 주소를 hreflang으로 묶는다", async ({scope}) => {
            /**
             * GIVEN
             * 공개 주소, 한국어 번역이 있는 문서와 없는 문서
             */
            const url = "https://docs.example.org";
            const site = siteConfigSchema.parse({url, lang: "en", locales: {ko: {}}});
            const localeScope = {...scope, locales: [{code: "ko", root: join(scope.root, "ko"), publicRoot: join(scope.root, "ko/public")}]};

            await mkdir(join(scope.root, "ko/public"), {recursive: true});

            await Promise.all([
                writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "setup.md"), "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---\n\nText.\n"),
                writeFile(join(scope.root, "ko/public/guide.md"), "---\nname: Guide\nlabel: 안내\ngroup: Guide\n---\n\nText.\n"),
            ]);

            /**
             * WHEN
             * 사이트맵 요청과 주소별 대체 링크 수집
             */
            const docs = await readDocs({scope: localeScope, processor: toProcessor({site, scope: localeScope})});
            const xml = await (await toCrawlingApp({url, site, store: {docs, homes: new Map()}}).request("/sitemap.xml")).text();
            const entries = new Map(
                [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/gs)].map((match) => {
                    return [match[1], [...match[2].matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((link) => `${link[1]} ${link[2]}`)];
                }),
            );

            /**
             * THEN
             * 두 홈과 세 문서 주소, 홈과 번역 문서의 세 대체 링크, 번역 없는 문서의 대체 링크 없음
             */
            expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
            expect(new Set(entries.keys())).toStrictEqual(new Set([`${url}/`, `${url}/ko/`, `${url}/guide/`, `${url}/setup/`, `${url}/ko/guide/`]));
            expect(entries.get(`${url}/`)).toStrictEqual([`en ${url}/`, `x-default ${url}/`, `ko ${url}/ko/`]);
            expect(entries.get(`${url}/ko/`)).toStrictEqual(entries.get(`${url}/`));
            expect(entries.get(`${url}/guide/`)).toStrictEqual([`en ${url}/guide/`, `x-default ${url}/guide/`, `ko ${url}/ko/guide/`]);
            expect(entries.get(`${url}/ko/guide/`)).toStrictEqual(entries.get(`${url}/guide/`));
            expect(entries.get(`${url}/setup/`)).toStrictEqual([]);
        });
    });
});

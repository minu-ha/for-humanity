import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {toSSG} from "hono/ssg";
import {describe, expect} from "vitest";
import {createProcessor} from "@/app/_function/create-processor/create-processor";
import {readDocs} from "@/app/_function/read-docs";
import {toCrawlingApp} from "@/app/_function/to-crawling-app";
import {toHttpApp} from "@/app/_function/to-http-app";
import {toPageApp} from "@/app/_function/to-page-app";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

describe("크롤러 파일", () => {
    test("공개 주소가 없으면 크롤러 파일을 제공하지 않는다", async () => {
        /**
         * GIVEN
         * 사이트 주소와 크롤러 문서 입력
         */
        const site = siteConfigSchema.parse({});
        const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePath: asset_style_path};
        const app = toHttpApp({pages: toPageApp({site, store: {docs: []}, assets}), files: new Map()});

        /**
         * WHEN
         * 크롤러 파일 요청
         */
        const robots = await app.request("/robots.txt");
        const sitemap = await app.request("/sitemap.xml");

        /**
         * THEN
         * 공개 주소가 없으면 크롤러 파일을 제공하지 않는 결과
         */
        expect(robots.status).toBe(404);
        expect(sitemap.status).toBe(404);
    });

    test("크롤러 파일은 현재 문서 목록의 인코딩한 주소를 제공한다", async ({root}) => {
        /**
         * GIVEN
         * 사이트 주소와 크롤러 문서 입력
         */
        await mkdir(join(root, "guide"));
        await writeFile(join(root, "guide.md"), "---\nname: Start\nlabel: Start\ngroup: Guide\n---\n\nStart here.\n");
        await writeFile(join(root, "guide/한국어 & tools.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\nText.\n");
        const url = "https://docs.example.org";
        const site = siteConfigSchema.parse({url});

        /**
         * WHEN
         * 페이지와 크롤러 응답 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const store = {docs};
        const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePath: asset_style_path};
        const app = toHttpApp({pages: toPageApp({site, store, assets}), crawling: toCrawlingApp({url, store}), files: new Map()});
        const robots = await app.request("/robots.txt");
        const sitemap = await app.request("/sitemap.xml");
        const xml = await sitemap.text();

        /**
         * THEN
         * 일반 문서 경로와 한글 인코딩한 사이트맵 주소 유지
         */
        expect((await app.request("/guide/")).status, "crawler routes must preserve ordinary document routes").toBe(200);
        expect((await app.request(`/guide/${encodeURIComponent("한국어 & tools")}/`)).status, "crawler routes must preserve nested document routes").toBe(200);
        expect(robots.status).toBe(200);
        expect(String(robots.headers.get("content-type"))).toMatch(/^text\/plain/);
        expect(await robots.text()).toBe("User-agent: *\nAllow: /\n\nSitemap: https://docs.example.org/sitemap.xml\n");
        expect(sitemap.status).toBe(200);
        expect(String(sitemap.headers.get("content-type"))).toMatch(/^application\/xml/);
        expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
        expect(xml).toMatch(/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
        expect(xml).toMatch(/<loc>https:\/\/docs\.example\.org\/<\/loc>/);
        expect(xml).toContain(`<loc>https://docs.example.org/guide/${encodeURIComponent("한국어 & tools")}/</loc>`);
        expect([...xml.matchAll(/<loc>/g)].length).toBe(3);
        expect(xml).not.toMatch(/<lastmod>|<changefreq>|<priority>|robots\.txt|sitemap\.xml|_fh|#read/);

        /**
         * WHEN
         * 개발 중 문서 삭제 후 사이트맵 재요청
         */
        store.docs = [];
        const updated = await (await app.request("/sitemap.xml")).text();

        /**
         * THEN
         * 홈 주소만 유지
         */
        expect([...updated.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])).toStrictEqual(["https://docs.example.org/"]);
    });

    test("정적 빌드는 크롤러 파일과 일반 문서 경로를 함께 생성한다", async ({root}) => {
        /**
         * GIVEN
         * 사이트 주소와 크롤러 문서 입력
         */
        await mkdir(join(root, "guide"));
        await writeFile(join(root, "guide.md"), "---\nname: Start\nlabel: Start\ngroup: Guide\n---\n\nStart here.\n");
        await writeFile(join(root, "guide/details.md"), "---\nname: Details\nlabel: Details\ngroup: Guide\n---\n\nNested details.\n");
        const url = "https://docs.example.org";
        const site = siteConfigSchema.parse({url});

        /**
         * WHEN
         * 페이지와 크롤러 응답 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePath: asset_style_path};
        const app = toPageApp({site, store: {docs}, assets});
        const result = await toSSG(app, {writeFile, mkdir}, {dir: root});
        const crawlerResult = await toSSG(toCrawlingApp({url, store: {docs}}), {writeFile, mkdir}, {dir: root});

        /**
         * THEN
         * 정적 빌드는 크롤러 파일과 일반 문서 경로를 함께 생성한 결과
         */

        expect(result.success).toBe(true);
        expect(crawlerResult.success).toBe(true);
        expect(result.files.length + crawlerResult.files.length, "home, both documents and both crawler files must be emitted").toBe(5);
        expect(await readFile(join(root, "guide/index.html"), "utf8")).toMatch(/Start here\./);
        expect(await readFile(join(root, "guide/details/index.html"), "utf8")).toMatch(/Nested details\./);
        expect(await readFile(join(root, "robots.txt"), "utf8")).toMatch(/Sitemap: https:\/\/docs\.example\.org\/sitemap\.xml/);
        expect(await readFile(join(root, "sitemap.xml"), "utf8")).toMatch(/<loc>https:\/\/docs\.example\.org\/<\/loc>/);
    });

    test.for([true, false])("크롤러 예약 여부 %s에 따라 문서 경로의 사용을 결정한다", async (reserved, {root}) => {
        /**
         * GIVEN
         * 사이트 주소와 크롤러 문서 입력
         */
        await mkdir(join(root, "sitemap.xml"));
        await writeFile(join(root, "Robots.txt.md"), "---\nname: Robots\nlabel: Robots\ngroup: Guide\n---\n\nText.\n");
        await writeFile(join(root, "sitemap.xml/guide.md"), "---\nname: Sitemap\nlabel: Sitemap\ngroup: Guide\n---\n\nText.\n");
        const site = siteConfigSchema.parse({});
        const processor = createProcessor({site, root});
        const params = {root, processor, reserved: reserved ? ["robots.txt", "sitemap.xml"] : undefined};

        /**
         * WHEN
         * 페이지와 크롤러 응답 생성
         */
        const result = readDocs(params);

        /**
         * THEN
         * 크롤러 예약 경로는 공개 주소를 지정한 경우에만 거부한 결과
         */
        if (reserved) {
            await expect(result).rejects.toThrow(/문서 id에 사용할 수 없는 경로/);
        } else {
            await expect(result).resolves.toHaveLength(2);
        }
    });
});

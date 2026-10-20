import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {asset_style_path} from "@/constant/asset";
import {docDataSchema} from "@/type/doc-data";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 페이지 셸 HTML(src/component/widget/shell/wg-shell.tsx) 검증
 */
describe("페이지 셸", () => {
    describe("head", () => {
        test("[SHL-001] head 자원의 중복을 제거하고 스타일 순서와 글꼴 선요청을 유지한다", async () => {
            /**
             * GIVEN
             * 중복된 CSS와 글꼴 자원
             */
            const assets = {
                fontCss: '@font-face { font-family: "Example"; src: url("/_fh/example.woff2") }',
                preload: ["/_fh/example.woff2", "/_fh/example.woff2"],
                stylePaths: ["/base.css", "/theme.css", "/base.css"],
                browser: {kind: "inline" as const, code: ""},
            };

            /**
             * WHEN
             * 공통 셸을 사용하는 홈 응답
             */
            const html = await (await toPageApp({site: siteConfigSchema.parse({}), store: {docs: []}, assets}).request("/")).text();
            const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));

            /**
             * THEN
             * 각 자원은 한 번만 선언, 본문보다 앞선 CSS와 글꼴 선언
             */
            expect([...head.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1])).toStrictEqual(["/base.css", "/theme.css"]);
            expect([...head.matchAll(/rel="preload"/g)]).toHaveLength(1);
            expect(head).toMatch(/as="font"[^>]*crossorigin/);
            expect(head).toContain(assets.fontCss);
            expect([...head.matchAll(/charset="utf-8"/g)]).toHaveLength(1);
            expect([...head.matchAll(/name="viewport"/g)]).toHaveLength(1);
            expect(head).not.toContain('name="description"');
            expect(html).toContain('<html lang="ko" class="wg_shell__document">');
        });

        test("[SHL-002] 동시 렌더에서 사이트와 문서의 제목과 설명을 공유하지 않는다", async () => {
            /**
             * GIVEN
             * 설명이 있는 사이트와 설명이 없는 다른 사이트
             */
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}};
            const doc = {id: "guide", data: docDataSchema.parse({name: "Guide", label: "Guide", group: "Guide"}), html: "", outline: {headings: [], sections: []}, ancestors: []};
            const first = toPageApp({site: siteConfigSchema.parse({title: "First", description: "First description"}), store: {docs: [doc]}, assets});
            const second = toPageApp({site: siteConfigSchema.parse({title: "Second"}), store: {docs: [doc]}, assets});

            /**
             * WHEN
             * 서로 다른 앱과 문서의 병렬 요청
             */
            const responses = await Promise.all([first.request("/guide/"), second.request("/"), first.request("/"), second.request("/guide/")]);
            const pages = await Promise.all(responses.map((response) => response.text()));

            /**
             * THEN
             * 요청한 페이지의 제목과 사이트 설명만 포함
             */
            expect(pages.map((page) => page.match(/<title>(.*?)<\/title>/)?.[1])).toStrictEqual(["Guide | First", "Second", "First", "Guide | Second"]);
            expect(pages.map((page) => page.includes('name="description"'))).toStrictEqual([true, false, true, false]);
            expect(pages[0]).toContain('content="First description"');
        });

        test("[SHL-003] 제목과 설명의 HTML 문자를 텍스트로 직렬화한다", async () => {
            /**
             * GIVEN
             * 태그 종료와 속성 삽입 모양의 사이트 설정
             */
            const site = siteConfigSchema.parse({title: 'Text </title><script>alert("x")</script> & end', description: 'Text "><script>alert("x")</script> &copy; end'});
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}};

            /**
             * WHEN
             * 설정에서 서버 HTML 생성
             */
            const html = await (await toPageApp({site, store: {docs: []}, assets}).request("/")).text();
            const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));

            /**
             * THEN
             * 실행 태그 생성 없이 제목 하나와 안전한 설명 속성 유지
             */
            expect([...head.matchAll(/<title>/g)]).toHaveLength(1);
            expect([...head.matchAll(/<\/title>/g)]).toHaveLength(1);
            expect(head).not.toContain("<script>");
            expect(head).toContain("&lt;script&gt;");
            expect(head).toContain("&amp; end");
            expect(head).toContain("&amp;copy; end");
            expect(head).toMatch(/name="description" content="Text &quot;/);
        });
    });

    describe("자원과 실행 순서", () => {
        test("[SHL-004] 페이지 자원은 내용 지문 경로와 하나의 인라인 브라우저 진입점을 사용한다", async () => {
            /**
             * GIVEN
             * 페이지 설정과 자원 입력
             */
            const site = siteConfigSchema.parse({});
            const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: "window.shellReady = true;"}, stylePaths: ["/_fh/style.abc123.css"]};
            const app = toPageApp({site, store: {docs: []}, assets});

            /**
             * WHEN
             * 페이지 렌더
             */
            const html = await (await app.request("/")).text();

            /**
             * THEN
             * 내용 지문 경로의 자원과 인라인 진입점 하나
             */
            expect(html).toMatch(/rel="stylesheet" href="\/_fh\/style\.abc123\.css"/);
            expect([...html.matchAll(/<script>window\.shellReady = true;<\/script>/g)]).toHaveLength(1);
            expect(html, "browser behavior must share one inline JSX entry").not.toMatch(/<script\b[^>]*\bsrc=/);
            expect(html).not.toMatch(/(?:href|src)="\/_fh\/(?:style\.css|client\.js)"/);
        });

        test("[SHL-005] 탐색 초기화는 탐색 DOM 뒤와 본문 앞에서 실행된다", async () => {
            /**
             * GIVEN
             * 커서 장식을 켠 페이지 설정과 브라우저 자원
             */
            const site = siteConfigSchema.parse({cursorFace: true});
            const browserScript = "window.navigationFixture = true;";
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: browserScript}};

            /**
             * WHEN
             * 페이지 렌더
             */
            const html = await (await toPageApp({site, store: {docs: []}, assets}).request("/")).text();
            const initialization = html.indexOf(`<script>${browserScript}</script>`);

            /**
             * THEN
             * 탐색 DOM 뒤, 본문 앞의 초기화 스크립트
             */
            expect(html, "server HTML must not serialize browser refs or handlers").not.toMatch(/\sref="|\sonClick="/);

            for (const marker of ["fh-navigation-data", "data-sidebar-drawer", "data-cursor-face", '<main class="wg_shell__main">']) {
                expect(html).toContain(marker);
            }

            expect(initialization).toBeGreaterThan(html.indexOf("fh-navigation-data"));
            expect(initialization).toBeGreaterThan(html.indexOf("data-sidebar-drawer"));
            expect(initialization).toBeGreaterThan(html.indexOf("data-cursor-face"));
            expect(initialization).toBeLessThan(html.indexOf('<main class="wg_shell__main">'));
        });
    });
});

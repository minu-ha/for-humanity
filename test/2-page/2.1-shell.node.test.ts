import {resolve} from "node:path";
import {HtmlValidate} from "html-validate";
import {describe, expect, test} from "vitest";
import {readProject} from "@/app/_function/read-project";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {loadSite} from "@/app/load-site";
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
            const html = await (await toPageApp({site: siteConfigSchema.parse({}), store: {docs: [], homes: new Map()}, assets}).request("/")).text();
            const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));

            /**
             * THEN
             * 중복 없는 자원 선언, 본문보다 앞선 CSS와 글꼴 선언
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
             * 설명이 있는 사이트, 설명이 없는 다른 사이트, 두 사이트가 함께 쓰는 문서
             */
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}};
            const doc = {
                id: "guide",
                data: docDataSchema.parse({name: "Guide", label: "Guide label", group: "Guide"}),
                html: "",
                outline: {headings: [], sections: []},
                ancestors: [],
            };
            const first = toPageApp({site: siteConfigSchema.parse({title: "First", description: "First description"}), store: {docs: [doc], homes: new Map()}, assets});
            const second = toPageApp({site: siteConfigSchema.parse({title: "Second"}), store: {docs: [doc], homes: new Map()}, assets});

            /**
             * WHEN
             * 서로 다른 앱과 문서의 병렬 요청
             */
            const responses = await Promise.all([first.request("/guide/"), second.request("/"), first.request("/"), second.request("/guide/")]);
            const pages = await Promise.all(responses.map((response) => response.text()));

            /**
             * THEN
             * 요청한 페이지의 제목, 문서 페이지의 label 설명, 홈의 사이트 설명
             */
            expect(pages.map((page) => page.match(/<title>(.*?)<\/title>/)?.[1])).toStrictEqual(["Guide | First", "Second", "First", "Guide | Second"]);
            expect(pages.map((page) => page.match(/name="description" content="([^"]*)"/)?.[1])).toStrictEqual(["Guide label", undefined, "First description", "Guide label"]);
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
            const html = await (await toPageApp({site, store: {docs: [], homes: new Map()}, assets}).request("/")).text();
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

        test("[SHL-009] html lang은 설정한 언어 태그를 사용한다", async () => {
            /**
             * GIVEN
             * 영어 언어 태그를 지정한 사이트
             */
            const site = siteConfigSchema.parse({lang: "en-US"});
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}};

            /**
             * WHEN
             * 홈 응답
             */
            const html = await (await toPageApp({site, store: {docs: [], homes: new Map()}, assets}).request("/")).text();

            /**
             * THEN
             * 설정한 언어 태그의 html 요소
             */
            expect(html).toContain('<html lang="en-US" class="wg_shell__document">');
        });

        test("[SHL-010] 공개 주소를 지정하면 대표 주소와 링크 미리보기 태그를 출력한다", async () => {
            /**
             * GIVEN
             * 미리보기 이미지가 있거나 없는 공개 사이트, 공개 주소 없는 사이트, 한글 경로의 하위 문서
             */
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}};
            const doc = {
                id: "가이드/설치",
                data: docDataSchema.parse({name: "Install", label: "Install the package", group: "Guide"}),
                html: "",
                outline: {headings: [], sections: []},
                ancestors: [],
            };
            const site = siteConfigSchema.parse({title: "Docs", description: "Site description", url: "https://docs.example.org"});
            const published = toPageApp({site, store: {docs: [doc], homes: new Map()}, assets: {...assets, image: "https://docs.example.org/_fh/media/asset.abc123.png"}});
            const imageless = toPageApp({site, store: {docs: [doc], homes: new Map()}, assets});
            const local = toPageApp({site: siteConfigSchema.parse({title: "Docs"}), store: {docs: [doc], homes: new Map()}, assets});

            /**
             * WHEN
             * 세 사이트의 문서와 홈 응답
             */
            const [page, home, imagelessPage, localPage] = await Promise.all(
                [published.request("/가이드/설치/"), published.request("/"), imageless.request("/가이드/설치/"), local.request("/가이드/설치/")].map(async (response) =>
                    (await response).text(),
                ),
            );

            /**
             * THEN
             * 사이트맵과 같은 인코딩의 대표 주소, 문서별 미리보기 태그와 큰 이미지 카드, 이미지 없는 사이트의 og:image 생략과 작은 카드, 공개 주소 없는 사이트의 태그 없음
             */
            expect(page).toContain('<link rel="canonical" href="https://docs.example.org/%EA%B0%80%EC%9D%B4%EB%93%9C/%EC%84%A4%EC%B9%98/">');
            expect(page).toContain('<meta property="og:url" content="https://docs.example.org/%EA%B0%80%EC%9D%B4%EB%93%9C/%EC%84%A4%EC%B9%98/">');
            expect(page).toContain('<meta property="og:title" content="Install">');
            expect(page).toContain('<meta property="og:site_name" content="Docs">');
            expect(page).toContain('<meta property="og:description" content="Install the package">');
            expect(page).toContain('<meta property="og:image" content="https://docs.example.org/_fh/media/asset.abc123.png">');
            expect(page).toContain('<meta name="twitter:card" content="summary_large_image">');
            expect(home).toContain('<link rel="canonical" href="https://docs.example.org/">');
            expect(home).toContain('<meta property="og:title" content="Docs">');
            expect(home).toContain('<meta property="og:description" content="Site description">');
            expect(home).toContain('<meta property="og:image" content="https://docs.example.org/_fh/media/asset.abc123.png">');
            expect(imagelessPage).toContain('<meta property="og:url"');
            expect(imagelessPage).not.toContain("og:image");
            expect(imagelessPage).toContain('<meta name="twitter:card" content="summary">');
            expect(localPage).not.toMatch(/rel="canonical"|property="og:|name="twitter:/);
        });
    });

    describe("HTML 표준", () => {
        test("[SHL-011] 공식 문서의 모든 공개 페이지 HTML은 표준 검사를 통과한다", {timeout: 60000}, async () => {
            /**
             * GIVEN
             * 저장소 설정과 공개 문서의 사이트, HTML 표준 규칙의 검사기
             */
            const project = await readProject(".");
            const snapshot = await loadSite({root: project.root, kitRoot: resolve("."), site: project.site});

            // README의 GitHub 가운데 정렬은 작성자가 고른 align 속성. 생성 HTML의 표준 위반만 검사
            const validator = new HtmlValidate({extends: ["html-validate:standard"], rules: {"no-deprecated-attr": "off"}});

            /**
             * WHEN
             * 사이트맵의 모든 페이지 응답 검사
             */
            const sitemap = await (await snapshot.app.request("/sitemap.xml")).text();
            const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
            const reports = await Promise.all(paths.map(async (path) => ({path, report: await validator.validateString(await (await snapshot.app.request(path)).text())})));

            /**
             * THEN
             * 홈과 문서 페이지, 경로와 줄을 붙인 표준 위반 없음
             */
            expect(paths).toContain("/");
            expect(paths.length).toBeGreaterThan(1);
            expect(
                reports.flatMap((entry) =>
                    entry.report.results.flatMap((result) => result.messages.map((message) => `${entry.path}:${message.line} ${message.ruleId} ${message.message}`)),
                ),
            ).toStrictEqual([]);
        });
    });

    describe("자원과 실행 순서", () => {
        test("[SHL-004] 페이지 자원은 내용 지문 경로와 인라인 브라우저 진입점 하나를 사용한다", async () => {
            /**
             * GIVEN
             * 페이지 설정과 자원 입력
             */
            const site = siteConfigSchema.parse({});
            const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: "window.shellReady = true;"}, stylePaths: ["/_fh/style.abc123.css"]};
            const app = toPageApp({site, store: {docs: [], homes: new Map()}, assets});

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
            const html = await (await toPageApp({site, store: {docs: [], homes: new Map()}, assets}).request("/")).text();
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

        test("[SHL-008] 소스 개발의 모듈 진입점은 첫 페인트를 막는 head 스크립트로 불러온다", async () => {
            /**
             * GIVEN
             * 모듈 진입점을 쓰는 소스 개발 자원
             */
            const site = siteConfigSchema.parse({});
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "module" as const, path: "/src/entry/browser/browser.tsx"}};

            /**
             * WHEN
             * 페이지 렌더
             */
            const html = await (await toPageApp({site, store: {docs: [], homes: new Map()}, assets}).request("/")).text();

            /**
             * THEN
             * head 안의 render-blocking 모듈 스크립트 하나
             */
            expect(html.slice(0, html.indexOf("</head>"))).toContain('<script type="module" src="/src/entry/browser/browser.tsx" blocking="render"></script>');
            expect(html.match(/browser\.tsx/g)).toHaveLength(1);
            expect(html).not.toContain('rel="expect"');
        });

        test("[SHL-012] 인라인 번들은 실행 완료 마커까지 첫 페인트를 막는 expect 링크를 head에 둔다", async () => {
            /**
             * GIVEN
             * 인라인 번들을 쓰는 배포 자원
             */
            const site = siteConfigSchema.parse({});
            const browserScript = "window.navigationFixture = true;";
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: browserScript}};

            /**
             * WHEN
             * 페이지 렌더
             */
            const html = await (await toPageApp({site, store: {docs: [], homes: new Map()}, assets}).request("/")).text();
            const initialization = html.indexOf(`<script>${browserScript}</script>`);
            const marker = html.indexOf('<div id="fh-browser-ready" hidden="">');

            /**
             * THEN
             * head의 expect 링크 하나와 번들 바로 뒤, 본문 앞의 마커
             */
            expect(html.slice(0, html.indexOf("</head>"))).toContain('<link rel="expect" href="#fh-browser-ready" blocking="render">');
            expect(html.match(/rel="expect"/g)).toHaveLength(1);
            expect(html.slice(initialization, marker)).toBe(`<script>${browserScript}</script>`);
            expect(marker).toBeLessThan(html.indexOf('<main class="wg_shell__main">'));
        });
    });

    describe("언어판", () => {
        test("[SHL-013] 언어판이 둘 이상인 페이지만 본문 위 언어 줄과 hreflang 링크, x-default를 둔다", async () => {
            /**
             * GIVEN
             * 영어 기본 언어와 한국어 번역, 하위 경로 배포, 번역이 있는 문서와 없는 문서
             */
            const site = siteConfigSchema.parse({lang: "en", url: "https://docs.example.org", basePath: "/project/", locales: {ko: {}}});
            const assets = {fontCss: "", preload: [], stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}};
            const data = docDataSchema.parse({name: "Guide", label: "Guide label", group: "Guide"});
            const outline = {headings: [], sections: []};
            const docs = [
                {id: "guide", data, html: "", outline, ancestors: []},
                {id: "ko/guide", locale: "ko", data, html: "", outline, ancestors: []},
                {id: "setup", data, html: "", outline, ancestors: []},
            ];
            const app = toPageApp({site, store: {docs, homes: new Map()}, assets});

            /**
             * WHEN
             * 번역 문서 양쪽, 번역 없는 문서, 두 홈 렌더와 head의 대체 링크 수집
             */
            const [guide, korean, setup, home, koreanHome] = await Promise.all(
                ["/guide/", "/ko/guide/", "/setup/", "/", "/ko/"].map(async (path) => (await app.request(path)).text()),
            );
            const alternates = (html: string) => {
                return [...html.slice(0, html.indexOf("</head>")).matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((match) => `${match[1]} ${match[2]}`);
            };

            /**
             * THEN
             * 번역 양쪽의 같은 대체 링크와 각자 대표 주소, 번역 없는 문서의 대체 링크와 언어 줄 없음, 두 홈의 대체 링크, 본문 위 언어 줄
             */
            expect(alternates(guide)).toStrictEqual([
                "en https://docs.example.org/project/guide/",
                "x-default https://docs.example.org/project/guide/",
                "ko https://docs.example.org/project/ko/guide/",
            ]);
            expect(alternates(korean)).toStrictEqual(alternates(guide));
            expect(korean).toContain('<link rel="canonical" href="https://docs.example.org/project/ko/guide/">');
            expect(korean).toContain('<html lang="ko"');
            expect(guide).toContain('<html lang="en"');
            expect(alternates(setup)).toStrictEqual([]);
            expect(alternates(home)).toStrictEqual([
                "en https://docs.example.org/project/",
                "x-default https://docs.example.org/project/",
                "ko https://docs.example.org/project/ko/",
            ]);
            expect(alternates(koreanHome)).toStrictEqual(alternates(home));
            expect(koreanHome).toContain('<link rel="canonical" href="https://docs.example.org/project/ko/">');
            expect(korean).toContain(
                '<main class="wg_shell__main"><nav class="wg_shell__languages" aria-label="Languages"><a class="wg_shell__language" href="/project/guide/" lang="en" hreflang="en">English</a> | <span class="wg_shell__language wg_shell__language--active" lang="ko" aria-current="true">한국어</span></nav>',
            );
            expect(guide).toContain(
                '<span class="wg_shell__language wg_shell__language--active" lang="en" aria-current="true">English</span> | <a class="wg_shell__language" href="/project/ko/guide/" lang="ko" hreflang="ko">한국어</a>',
            );
            expect(setup).not.toContain("wg_shell__languages");
            expect(home).toContain('href="/project/ko/" lang="ko" hreflang="ko">한국어</a>');
        });
    });
});

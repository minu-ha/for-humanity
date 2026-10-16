import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {toPageApp} from "@/app/_function/to-page-app";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

describe("페이지 셸", () => {
    test("페이지 자원은 내용 지문 경로와 하나의 인라인 브라우저 진입점을 사용한다", async () => {
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
         * 페이지 자원은 내용 지문 경로와 하나의 인라인 브라우저 진입점을 사용한 결과
         */
        expect(html).toMatch(/rel="stylesheet" href="\/_fh\/style\.abc123\.css"/);
        expect([...html.matchAll(/<script>window\.shellReady = true;<\/script>/g)]).toHaveLength(1);
        expect(html, "browser behavior must share one inline JSX entry").not.toMatch(/<script\b[^>]*\bsrc=/);
        expect(html).not.toMatch(/(?:href|src)="\/_fh\/(?:style\.css|client\.js)"/);
    });

    test("탐색 초기화는 탐색 DOM 뒤와 본문 앞에서 실행된다", async () => {
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
         * 탐색 초기화는 탐색 DOM 뒤와 본문 앞에서 실행된 결과
         */
        expect(html, "server HTML must not serialize browser refs or handlers").not.toMatch(/\sref="|\sonClick="/);
        for (const marker of ["fh-navigation-data", "data-navigation-drawer", "data-cursor-face", '<main class="wg_shell__main">']) {
            expect(html).toContain(marker);
        }
        expect(initialization).toBeGreaterThan(html.indexOf("fh-navigation-data"));
        expect(initialization).toBeGreaterThan(html.indexOf("data-navigation-drawer"));
        expect(initialization).toBeGreaterThan(html.indexOf("data-cursor-face"));
        expect(initialization).toBeLessThan(html.indexOf('<main class="wg_shell__main">'));
    });
});

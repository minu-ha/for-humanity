import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {createProcessor} from "@/app/_function/create-processor/create-processor";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toPageApp} from "@/app/_function/to-page-app";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

describe("홈페이지", () => {
    test("루트 README는 홈으로 렌더되고 중첩 문서의 홈 링크를 해석한다", async ({root}) => {
        /**
         * GIVEN
         * 홈페이지와 문서 입력
         */
        const site = siteConfigSchema.parse({});
        const processor = createProcessor({site, root});

        await mkdir(join(root, "guide"));
        await Promise.all([
            writeFile(
                join(root, "readme.md"),
                '<div align="center">\n\n<img src="/favicon.svg" width="96" height="96" alt="Library face">\n\n# My library\n\nWelcome home.\n\n</div>\n\n## Start\n\n[Guide](guide/setup.md)\n\n```js\nconst ready = true;\n```\n',
            ),
            writeFile(join(root, "guide/setup.md"), "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---\n\n[Home](../readme.md#start)\n\n## Details\n"),
        ]);

        /**
         * WHEN
         * 홈페이지 렌더
         */
        const [docs, home] = await Promise.all([readDocs({root, processor}), readHome({root, processor})]);
        const app = toPageApp({
            site,
            store: {docs, home},
            assets: {stylePath: asset_style_path, browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
        });
        const response = await app.request("/");
        const html = await response.text();

        /**
         * THEN
         * 루트 README는 홈으로 렌더되고 중첩 문서의 홈 링크를 해석한 결과
         */
        expect(response.status).toBe(200);
        expect(docs.map((doc) => doc.id)).toStrictEqual(["guide/setup"]);
        expect(html).toMatch(/<h1[^>]*><span[^>]*>My library<\/span><\/h1>/);
        expect(html).toMatch(/Welcome home\./);
        expect(html).toMatch(/<div align="center">/);
        expect(html).toMatch(/src="\/favicon\.svg" width="96" height="96"/);
        expect(html).toMatch(/href="\/guide\/setup\/"/);
        expect(html).toMatch(/href="#start" data-toc-link/);
        expect(html).toMatch(/class="shiki/);
        expect(html).toMatch(/wg_navigation__brand" href="\/" aria-current="page"/);
        expect([...html.matchAll(/href="\/"/g)].length).toBe(1);
        expect(docs[0].html).toMatch(/href="\/#start"/);
        expect(html).not.toMatch(/wg_prose__eyebrow|pg_home__card/);
        expect((await app.request("/readme/")).status).toBe(404);
    });

    test("README가 없으면 홈페이지 작성 안내를 표시한다", async ({root}) => {
        /**
         * GIVEN
         * 홈페이지와 문서 입력
         */
        const site = siteConfigSchema.parse({});

        /**
         * WHEN
         * 홈페이지 렌더
         */
        const home = await readHome({root, processor: createProcessor({site, root})});
        const app = toPageApp({
            site,
            store: {docs: [], home},
            assets: {stylePath: asset_style_path, browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
        });
        const html = await (await app.request("/")).text();

        /**
         * THEN
         * README가 없으면 홈페이지 작성 안내를 표시한 결과
         */
        expect(home).toBe(undefined);
        expect(html).toMatch(/문서 폴더에 README\.md를 추가/);
        expect(html).not.toMatch(/pg_home__card|>Overview<|>Documents</);
    });
});

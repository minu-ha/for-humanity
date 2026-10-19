import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {createProcessor} from "@/app/_function/create-processor/create-processor";
import {readDocs} from "@/app/_function/read-docs";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

describe("문서 링크와 목차", () => {
    test("상대 Markdown 링크는 쿼리와 앵커를 보존한다", async ({root}) => {
        /**
         * GIVEN
         * 링크와 제목을 포함한 문서 입력
         */
        const site = siteConfigSchema.parse({});

        await mkdir(join(root, "guide"));
        await Promise.all([
            writeFile(join(root, "README.md"), "# Home\n\n## Start\n"),
            writeFile(join(root, "api.mdx"), "---\nname: API\nlabel: API\ngroup: Guide\n---\n\n## Details\n"),
            writeFile(
                join(root, "guide/setup.md"),
                [
                    "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---",
                    "[API](../api.mdx?mode=compact&lang=ko#details)",
                    "[Query only](../api.mdx?mode=compact)",
                    "[Home](../README.md?lang=ko#start)",
                    "[Reference][api]\n\n[api]: ../api.mdx?mode=reference#details",
                    "[Fragment](../api.mdx#details?literal=yes)",
                    "[External](https://example.com/api.md?mode=compact#details)",
                    "[Absolute](/api.md?mode=compact#details)",
                    "[Asset](/diagram.svg?version=2#label)",
                    "[Local](#details?literal=yes)",
                ].join("\n\n"),
            ),
        ]);

        /**
         * WHEN
         * 문서 링크와 목차 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const setup = docs.find((doc) => doc.id === "guide/setup");

        /**
         * THEN
         * 상대 Markdown 링크는 쿼리와 앵커를 보존한 결과
         */
        expect(setup?.html).toMatch(/href="\/api\/\?mode=compact&#x26;lang=ko#details"/);
        expect(setup?.html).toMatch(/href="\/api\/\?mode=compact"/);
        expect(setup?.html).toMatch(/href="\/\?lang=ko#start"/);
        expect(setup?.html).toMatch(/href="\/api\/\?mode=reference#details"/);
        expect(setup?.html).toMatch(/href="\/api\/#details\?literal=yes"/);
        expect(setup?.html).toMatch(/href="https:\/\/example\.com\/api\.md\?mode=compact#details"/);
        expect(setup?.html).toMatch(/href="\/api\.md\?mode=compact#details"/);
        expect(setup?.html).toMatch(/href="\/diagram\.svg\?version=2#label"/);
        expect(setup?.html).toMatch(/href="#details\?literal=yes"/);
    });

    test("제목과 목차는 작성한 텍스트와 번호를 보존한다", async ({root}) => {
        /**
         * GIVEN
         * 링크와 제목을 포함한 문서 입력
         */
        const site = siteConfigSchema.parse({});

        await writeFile(
            join(root, "guide.md"),
            "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n### Before the first section\n\n::part[Setup]\n\n## Overview\n\n### 01. Keep this number\n\n:::details[More]\n### Nested heading\n\nBody.\n:::\n\n## Overview\n",
        );

        /**
         * WHEN
         * 문서 링크와 목차 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const app = toPageApp({
            site,
            store: {docs},
            assets: {stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
        });
        const html = await (await app.request("/guide/")).text();

        /**
         * THEN
         * 제목과 목차는 작성한 텍스트와 번호를 보존한 결과
         */
        expect(html).toMatch(/<h2[^>]*id="overview"[^>]*><span class="wg_article__headingText">Overview<\/span><\/h2>/);
        expect(html).toMatch(/<h3[^>]*id="01-keep-this-number"[^>]*><span class="wg_article__headingText">01\. Keep this number<\/span><\/h3>/);
        expect(html).toMatch(/href="#overview"[^>]*>Overview<\/a>/);
        expect(html).toMatch(/href="#01-keep-this-number"[^>]*>01\. Keep this number<\/a>/);
        expect(html).toMatch(/href="#nested-heading"[^>]*>Nested heading<\/a>/);
        expect(html).toMatch(/href="#overview-1"[^>]*>Overview<\/a>/);
        expect(html).toMatch(/wg_navigationToc__group">Setup<\/div>/);
        expect(html).not.toMatch(/wg_article__num|wg_navigationToc__mark/);
    });
});

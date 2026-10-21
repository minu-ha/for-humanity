import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect, vi} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";
import {logger} from "@/util/logger/logger";

/**
 * 문서 링크와 목차(src/component/widget/article/_function/remark-links.ts, src/app/_function/to-processor/_rehype-content-links.ts) 검증
 */
describe("문서 링크와 목차", () => {
    describe("상대 링크", () => {
        test("[LNK-001] 상대 Markdown 링크는 쿼리와 앵커를 보존한다", async ({scope}) => {
            /**
             * GIVEN
             * 쿼리와 앵커가 있는 상대 링크 문서
             */
            const site = siteConfigSchema.parse({});

            await mkdir(join(scope.publicRoot, "guide"));

            await Promise.all([
                writeFile(join(scope.root, "README.md"), "# Home\n\n## Start\n"),
                writeFile(join(scope.publicRoot, "api.mdx"), "---\nname: API\nlabel: API\ngroup: Guide\n---\n\n## Details\n"),
                writeFile(
                    join(scope.publicRoot, "guide/setup.md"),
                    [
                        "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---",
                        "[API](../api.mdx?mode=compact&lang=ko#details)",
                        "[Query only](../api.mdx?mode=compact)",
                        "[Home](../../README.md?lang=ko#start)",
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
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const setup = docs.find((doc) => doc.id === "guide/setup");

            /**
             * THEN
             * 쿼리와 앵커를 유지한 사이트 주소
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

        test.for([
            {caseId: "LNK-002", source: "[Guide](setup%zz.md)"},
            {caseId: "LNK-003", source: '<img src="image%zz.png" alt="">'},
        ])("[$caseId] 잘못된 퍼센트 인코딩 참조 $source 입력은 작성 위치와 함께 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 해석할 수 없는 인코딩을 포함한 상대 참조
             */
            const site = siteConfigSchema.parse({});

            await writeFile(join(scope.publicRoot, "guide.md"), `---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n${scenario.source}\n`);

            /**
             * WHEN
             * 문서 로드
             */
            const result = readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 인코딩 오류와 원본 행 번호
             */
            await expect(result).rejects.toThrow(/Invalid percent-encoding/);
            await expect(result).rejects.toHaveProperty("line", 7);
        });

        test("[LNK-005] 없는 문서를 가리키는 Markdown 링크와 원시 HTML 링크는 작성 위치와 함께 경고한다", async ({scope}) => {
            /**
             * GIVEN
             * 없는 문서를 가리키는 Markdown 링크와 원시 HTML 링크
             */
            const site = siteConfigSchema.parse({});
            const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);

            await writeFile(join(scope.publicRoot, "guide.md"), '---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n[Doc](gone.md)\n\n<a href="missing.md#start">Doc</a>\n');

            /**
             * WHEN
             * 문서 로드
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 사이트 주소로 바꾼 두 링크와 파일, 줄 번호가 붙은 경고
             */
            expect(docs[0].html).toContain('href="/gone/"');
            expect(docs[0].html).toContain('href="/missing/#start"');

            expect(warn.mock.calls).toStrictEqual([
                [`${join("public", "guide.md")}:7 Link to a missing document: gone.md`],
                [`${join("public", "guide.md")}:9 Link to a missing document: missing.md#start`],
            ]);
        });

        test("[LNK-006] 스킴으로 시작하는 Markdown 링크는 작성한 주소를 유지하고 경고하지 않는다", async ({scope}) => {
            /**
             * GIVEN
             * 스킴으로 시작하는 .md 링크
             */
            const site = siteConfigSchema.parse({});
            const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);

            await writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n[Notes](web+app:notes.md)\n");

            /**
             * WHEN
             * 문서 로드
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 작성한 주소의 링크와 경고 없음
             */
            expect(docs[0].html).toContain('href="web+app:notes.md"');
            expect(warn).not.toHaveBeenCalled();
        });
    });

    describe("제목과 목차", () => {
        test("[LNK-004] 제목과 목차는 작성한 텍스트와 번호를 보존한다", async ({scope}) => {
            /**
             * GIVEN
             * 번호, 가름, 중복 제목이 있는 문서
             */
            const site = siteConfigSchema.parse({});

            await writeFile(
                join(scope.publicRoot, "guide.md"),
                "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n### Before the first section\n\n::part[Setup]\n\n## Overview\n\n### 01. Keep this number\n\n:::details[More]\n### Nested heading\n\nBody.\n:::\n\n## Overview\n",
            );

            /**
             * WHEN
             * 문서 링크와 목차 생성
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});

            const app = toPageApp({
                site,
                store: {docs},
                assets: {stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
            });

            const html = await (await app.request("/guide/")).text();

            /**
             * THEN
             * 작성한 텍스트와 번호를 유지한 제목 id와 목차
             */
            expect(html).toMatch(/<h2[^>]*id="overview"[^>]*><span class="wg_article__headingText">Overview<\/span><\/h2>/);
            expect(html).toMatch(/<h3[^>]*id="01-keep-this-number"[^>]*><span class="wg_article__headingText">01\. Keep this number<\/span><\/h3>/);
            expect(html).toMatch(/href="#overview"[^>]*>Overview<\/a>/);
            expect(html).toMatch(/href="#01-keep-this-number"[^>]*>01\. Keep this number<\/a>/);
            expect(html).toMatch(/href="#nested-heading"[^>]*>Nested heading<\/a>/);
            expect(html).toMatch(/href="#overview-1"[^>]*>Overview<\/a>/);
            expect(html).toMatch(/wg_toc__group">Setup<\/div>/);
            expect(html).not.toMatch(/wg_article__num|wg_toc__mark/);
        });

        test.for([
            {caseId: "LNK-007", source: "::part"},
            {caseId: "LNK-008", source: "::part[]"},
            {caseId: "LNK-009", source: "::part[ ]"},
        ])("[$caseId] 이름 없는 가름 $source 입력은 작성 위치와 함께 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 이름을 생략하거나 비운 가름
             */
            const site = siteConfigSchema.parse({});

            await writeFile(join(scope.publicRoot, "guide.md"), `---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n${scenario.source}\n\n## Overview\n\nText.\n`);

            /**
             * WHEN
             * 문서 로드
             */
            const result = readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 빈 제목 오류와 원본 행 번호
             */
            await expect(result).rejects.toThrow(/Invalid part syntax: part needs a non-empty title/);
            await expect(result).rejects.toHaveProperty("line", 7);
        });
    });
});

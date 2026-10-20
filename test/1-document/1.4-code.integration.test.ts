import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 코드 블록과 스니펫(src/component/widget/article/_constant/shiki-transformers.ts, src/app/_function/to-processor/_remark-snippets.ts) 검증
 */
describe("코드 블록", () => {
    describe("코드 표기", () => {
        test("[COD-001] 코드 줄 표기와 메타 정보가 강조와 줄 번호로 표시된다", async ({scope}) => {
            /**
             * GIVEN
             * 줄별 오류, 변경 표시와 강조 메타를 포함한 코드
             */

            await writeFile(
                join(scope.publicRoot, "guide.md"),
                "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\n```ts line-numbers\nconst a = 1; // [!code error]\nconst b = 2; // [!code ++]\nconst c = 3;\n```\n\n```txt\n# [!code highlight]\nfirst\nsecond\n```\n\n```css {2}\n.a {\n  color: red;\n}\n```\n",
            );

            const site = siteConfigSchema.parse({});

            /**
             * WHEN
             * Markdown 처리
             */
            const [doc] = await readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 줄 상태와 번호 표시, 지시문 원문 제외
             */
            expect(doc.html).toMatch(/<pre class="[^"]*wg_article__lineNumbers[^"]*"/);
            expect(doc.html).toMatch(/<span class="line highlighted error">/);
            expect(doc.html).toMatch(/<span class="line diff add">/);
            expect(doc.html).toMatch(/<span class="line highlighted">[^\n]*first/);
            expect(doc.html).not.toContain("[!code");
            expect(doc.html.split('<span class="line highlighted">').length - 1, "a standalone txt notation line and the css {2} meta each highlight one line").toBe(2);
        });

        test("[COD-002] 대괄호 메타는 코드 색상을 유지한 파일 제목으로 표시된다", async ({scope}) => {
            /**
             * GIVEN
             * 파일 제목과 상태 메타를 가진 코드, 제목 없는 코드
             */

            await writeFile(
                join(scope.publicRoot, "guide.md"),
                "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\n```ts bad [page/products.ts]\nconst a = 1;\n```\n\n```ts {1}\nconst b = 2;\n```\n",
            );

            const site = siteConfigSchema.parse({});

            /**
             * WHEN
             * Markdown 처리
             */
            const [doc] = await readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 파일 제목과 작성 언어 표시, 코드와 제목의 상태 공유
             */
            expect(doc.html).toMatch(
                /<figcaption class="[^"]*wg_article__codeFileTitle--bad[^"]*">page\/products\.ts<span class="wg_article__codeFileLang">ts<\/span><\/figcaption>/,
            );
            expect(doc.html).toMatch(/<pre class="[^"]*wg_article__code--bad[^"]*"/);
            expect(doc.html).not.toMatch(/<pre\b[^>]*\bstyle=/);
            expect(doc.html.split("<figure").length - 1, "braces meta is not a title").toBe(1);
        });
    });

    describe("스니펫", () => {
        test("[COD-003] 스니펫은 문서 루트의 파일과 영역을 불러오고 코드 메타를 전달한다", async ({scope}) => {
            /**
             * GIVEN
             * region 지시문과 들여쓰기를 포함한 TypeScript 스니펫
             */

            await mkdir(join(scope.publicRoot, "snippet"));

            await writeFile(
                join(scope.publicRoot, "snippet", "example.ts"),
                "const outside = 0;\n// #region picked\n    const a = 1; // [!code error]\n    const b = 2;\n// #endregion picked\nconst after = 3;\n",
            );

            await writeFile(
                join(scope.publicRoot, "guide.md"),
                "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\n<<< ./snippet/example.ts#picked bad line-numbers\n\n<<< ./snippet/example.ts\n",
            );

            const site = siteConfigSchema.parse({});

            /**
             * WHEN
             * Markdown 처리
             */
            const [doc] = await readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 전체 파일과 선택 영역의 코드, 지시문 제외와 메타 전달
             */
            expect(doc.html).toMatch(
                /<pre class="[^"]*wg_article__lineNumbers[^"]*wg_article__code--bad[^"]*"|<pre class="[^"]*wg_article__code--bad[^"]*wg_article__lineNumbers[^"]*"/,
            );

            expect(doc.html).toMatch(/<span class="line highlighted error">[^\n]*const<\/span>[^\n]* a/);
            expect(doc.html).not.toContain("#region");
            expect(doc.html.split("const</span>").length - 1, "the region block has two lines and the whole-file block four").toBe(2 + 4);
        });

        test.for([
            {caseId: "COD-004", reference: "../../outside.ts", expected: /Reference outside the document scope/},
            {caseId: "COD-005", reference: "./missing.ts", expected: /file not found/},
            {caseId: "COD-006", reference: "./present.ts#nope", expected: /region not found/},
        ])("[$caseId] 유효하지 않은 스니펫 $reference 참조를 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 문서 범위 안의 스니펫 파일과 실패 경로
             */
            const site = siteConfigSchema.parse({});

            await writeFile(join(scope.publicRoot, "present.ts"), "const y = 2;\n");
            await writeFile(join(scope.publicRoot, "guide.md"), `---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n<<< ${scenario.reference}\n`);

            /**
             * WHEN
             * Markdown 처리
             */
            const result = readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 루트 이탈, 누락 파일, 누락 region의 오류
             */
            await expect(result).rejects.toThrow(scenario.expected);
        });
    });
});

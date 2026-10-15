import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {createProcessor} from "@/app/_function/create-processor/create-processor";
import {readDocs} from "@/app/_function/read-docs";
import {siteConfigSchema} from "@/type/site-config";

describe("코드 블록", () => {
    test("코드 줄 표기와 메타 정보가 강조와 줄 번호로 표시된다", async ({root}) => {
        /**
         * GIVEN
         * 코드 표기가 포함된 문서 입력
         */

        await writeFile(
            join(root, "guide.md"),
            "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\n```ts line-numbers\nconst a = 1; // [!code error]\nconst b = 2; // [!code ++]\nconst c = 3;\n```\n\n```txt\n# [!code highlight]\nfirst\nsecond\n```\n\n```css {2}\n.a {\n  color: red;\n}\n```\n",
        );
        const site = siteConfigSchema.parse({});
        /**
         * WHEN
         * Markdown 처리
         */
        const [doc] = await readDocs({root, processor: createProcessor({site, root})});

        /**
         * THEN
         * 코드 줄 표기와 메타 정보가 강조와 줄 번호로 표시된 결과
         */
        expect(doc.html).toMatch(/<pre class="[^"]*wg_prose__lineNumbers[^"]*"/);
        expect(doc.html).toMatch(/<span class="line highlighted error">/);
        expect(doc.html).toMatch(/<span class="line diff add">/);
        expect(doc.html).toMatch(/<span class="line highlighted">[^\n]*first/);
        expect(doc.html).not.toContain("[!code");
        expect(doc.html.split('<span class="line highlighted">').length - 1, "a standalone txt notation line and the css {2} meta each highlight one line").toBe(2);
    });

    test("대괄호 메타는 코드 색상을 유지한 파일 제목으로 표시된다", async ({root}) => {
        /**
         * GIVEN
         * 코드 표기가 포함된 문서 입력
         */

        await writeFile(
            join(root, "guide.md"),
            "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\n```ts bad [page/products.ts]\nconst a = 1;\n```\n\n```ts {1}\nconst b = 2;\n```\n",
        );
        const site = siteConfigSchema.parse({});
        /**
         * WHEN
         * Markdown 처리
         */
        const [doc] = await readDocs({root, processor: createProcessor({site, root})});

        /**
         * THEN
         * 대괄호 메타는 코드 색상을 유지한 파일 제목으로 표시된 결과
         */
        expect(doc.html).toMatch(
            /<figure class="wg_prose__codeFile wg_prose__codeFile--bad"><figcaption class="wg_prose__codeFileTitle">page\/products\.ts<span class="wg_prose__codeFileLang">ts<\/span><\/figcaption><pre class="[^"]*wg_prose__code--bad/,
        );
        expect(doc.html.split("<figure").length - 1, "braces meta is not a title").toBe(1);
    });

    test("스니펫은 문서 루트의 파일과 영역을 불러오고 코드 메타를 전달한다", async ({root}) => {
        /**
         * GIVEN
         * 코드 표기가 포함된 문서 입력
         */

        await mkdir(join(root, "snippet"));
        await writeFile(
            join(root, "snippet", "example.ts"),
            "const outside = 0;\n// #region picked\n    const a = 1; // [!code error]\n    const b = 2;\n// #endregion picked\nconst after = 3;\n",
        );
        await writeFile(
            join(root, "guide.md"),
            "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\n<<< ./snippet/example.ts#picked bad line-numbers\n\n<<< ./snippet/example.ts\n",
        );
        const site = siteConfigSchema.parse({});
        /**
         * WHEN
         * Markdown 처리
         */
        const [doc] = await readDocs({root, processor: createProcessor({site, root})});

        /**
         * THEN
         * 스니펫은 문서 루트의 파일과 영역을 불러오고 코드 메타를 전달한 결과
         */
        expect(doc.html).toMatch(/<pre class="[^"]*wg_prose__lineNumbers[^"]*wg_prose__code--bad[^"]*"|<pre class="[^"]*wg_prose__code--bad[^"]*wg_prose__lineNumbers[^"]*"/);
        expect(doc.html).toMatch(/<span class="line highlighted error">[^\n]*const<\/span>[^\n]* a/);
        expect(doc.html).not.toContain("#region");
        expect(doc.html.split("const</span>").length - 1, "the region block has two lines and the whole-file block four").toBe(2 + 4);
    });

    test.for([
        {reference: "../outside.ts", expected: /문서 폴더 밖/},
        {reference: "./missing.ts", expected: /파일이 없다/},
        {reference: "./present.ts#nope", expected: /region 이 없다/},
    ])("유효하지 않은 스니펫 $reference 참조를 거부한다", async ({reference, expected}, {root}) => {
        /**
         * GIVEN
         * 코드 표기가 포함된 문서 입력
         */

        await mkdir(join(root, "docs"));
        await writeFile(join(root, "outside.ts"), "const x = 1;\n");
        await writeFile(join(root, "docs", "present.ts"), "const y = 2;\n");
        const site = siteConfigSchema.parse({});
        const docsRoot = join(root, "docs");

        await writeFile(join(docsRoot, "guide.md"), `---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n<<< ${reference}\n`);
        /**
         * WHEN
         * Markdown 처리
         */
        const result = readDocs({root: docsRoot, processor: createProcessor({site, root: docsRoot})});
        /**
         * THEN
         * 스니펫의 루트 이탈과 누락 파일과 누락 영역을 거부한 결과
         */
        await expect(result).rejects.toThrow(expected);
    });
});

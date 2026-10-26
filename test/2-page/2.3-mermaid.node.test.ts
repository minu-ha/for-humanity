import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 다이어그램 원문 변환(src/component/widget/mermaid/_function/remark-mermaid.ts) 검증
 */
describe("다이어그램", () => {
    describe("문서 조립", () => {
        test("[MRM-025] 문서의 다이어그램 원문은 한글과 특수문자를 유지한다", async ({scope}) => {
            /**
             * GIVEN
             * 한글과 HTML 문자가 포함된 Markdown 문서
             */
            const source = 'treeView-beta\n    docs/\n        "한글 <script>alert(1)</script> & guide.md"';

            await writeFile(join(scope.publicRoot, "guide.md"), `---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n\`\`\`mermaid\n${source}\n\`\`\`\n`);

            const site = siteConfigSchema.parse({});

            /**
             * WHEN
             * 문서 조립
             */
            const [result] = await readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 실행 가능한 HTML 없이 원문과 렌더 영역 유지
             */
            expect(result.html).toContain("data-mermaid-source");
            expect(result.html).toContain("한글");
            expect(result.html).toContain("guide.md");
            expect(result.html).toContain("alert(1)");
            expect(result.html).not.toMatch(/<script>|<svg|ascii-flow/);
        });

        test("[MRM-026] 홈의 다이어그램도 브라우저 모듈 경로를 전달한다", async ({scope}) => {
            /**
             * GIVEN
             * 다이어그램을 포함한 홈 문서와 모듈 목록
             */
            const site = siteConfigSchema.parse({});
            const mermaid = {entry: "/_fh/mermaid/mermaid-HASH.js", files: new Map([["/_fh/mermaid/mermaid-HASH.js", "/kit/mermaid-HASH.js"]])};

            await writeFile(join(scope.root, "README.md"), "# Home\n\n```mermaid\nsequenceDiagram\n User->>Docs: Read\n```\n");

            /**
             * WHEN
             * 홈 문서 조립
             */
            const result = await readHome({dir: scope.root, scope, processor: toProcessor({site, scope, mermaid})});

            /**
             * THEN
             * 자체 호스팅 진입 경로 전달
             */
            expect(result?.html).toContain('data-mermaid-module="/_fh/mermaid/mermaid-HASH.js"');
        });
    });
});

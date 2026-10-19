import type {Root} from "mdast";
import {describe, expect, test} from "vitest";
import {remarkMermaid} from "@/component/widget/mermaid/_function/remark-mermaid";

describe("다이어그램", () => {
    describe("원문 변환", () => {
        test("다이어그램 원문은 실행 가능한 HTML 없이 보존된다", () => {
            /**
             * GIVEN
             * 한글과 HTML 문자가 포함된 다이어그램
             */
            const tree: Root = {type: "root", children: [{type: "code", lang: "mermaid", value: 'treeView-beta\n한글 <script>alert("x")</script> & guide.md'}]};

            /**
             * WHEN
             * 다이어그램 영역 변환
             */
            remarkMermaid({files: new Map()})(tree);

            const result = tree.children[0];

            /**
             * THEN
             * 이스케이프한 원문과 숨겨진 렌더 영역
             */
            expect(result.type).toBe("html");
            expect(result).toHaveProperty("value", expect.stringContaining('한글 &lt;script&gt;alert("x")&lt;/script&gt; &amp; guide.md'));
            expect(result).toHaveProperty("value", expect.stringContaining('class="wg_mermaid__result" hidden'));
            expect(result).toHaveProperty("value", expect.stringContaining('role="status" hidden'));
            expect(result).toHaveProperty("value", expect.not.stringMatching(/<script>|<svg|data-mermaid-module=/));
        });

        test("일반 코드 블록은 다이어그램으로 변환되지 않는다", () => {
            /**
             * GIVEN
             * 일반 텍스트 코드 블록
             */
            const tree: Root = {type: "root", children: [{type: "code", lang: "text", value: "docs/\n└── guide.md"}]};

            /**
             * WHEN
             * 다이어그램 영역 변환
             */
            remarkMermaid({files: new Map()})(tree);

            const result = tree.children;

            /**
             * THEN
             * 원래 코드 블록 유지
             */
            expect(result).toStrictEqual([{type: "code", lang: "text", value: "docs/\n└── guide.md"}]);
        });

        test("다이어그램이 있으면 전체 모듈 그래프와 고지가 등록된다", () => {
            /**
             * GIVEN
             * 다이어그램과 자체 호스팅 모듈 목록
             */
            const tree: Root = {type: "root", children: [{type: "code", lang: "mermaid", value: "flowchart LR\n A --> B"}]};

            const assets = {
                entry: "/_fh/mermaid/mermaid-HASH.js",
                files: new Map([
                    ["/_fh/mermaid/mermaid-HASH.js", "/kit/mermaid-HASH.js"],
                    ["/_fh/mermaid/chunk-HASH.js", "/kit/chunk-HASH.js"],
                    ["/_fh/mermaid/THIRD-PARTY-NOTICES.txt", "/kit/THIRD-PARTY-NOTICES.txt"],
                ]),
            };

            const files = new Map([["/_fh/existing.css", "/kit/existing.css"]]);

            /**
             * WHEN
             * 다이어그램 영역 변환
             */
            remarkMermaid({assets, files})(tree);

            const result = {markup: tree.children[0], files};

            /**
             * THEN
             * 기존 자원과 전체 모듈 목록 유지
             */
            expect(result.markup).toHaveProperty("value", expect.stringContaining('data-mermaid-module="/_fh/mermaid/mermaid-HASH.js"'));
            expect(result.files).toStrictEqual(new Map([["/_fh/existing.css", "/kit/existing.css"], ...assets.files]));
        });

        test("다이어그램이 없으면 모듈 그래프가 등록되지 않는다", () => {
            /**
             * GIVEN
             * 다이어그램이 없는 문서와 모듈 목록
             */
            const tree: Root = {type: "root", children: [{type: "paragraph", children: [{type: "text", value: "문서"}]}]};
            const assets = {entry: "/_fh/mermaid/mermaid-HASH.js", files: new Map([["/_fh/mermaid/mermaid-HASH.js", "/kit/mermaid-HASH.js"]])};
            const files = new Map<string, string>();

            /**
             * WHEN
             * 다이어그램 영역 변환
             */
            remarkMermaid({assets, files})(tree);

            const result = files;

            /**
             * THEN
             * 추가 자원 없음
             */
            expect(result.size).toBe(0);
        });
    });
});

import type {Root} from "mdast";
import {VFile} from "vfile";
import {describe, expect, test, vi} from "vitest";
import {remarkLinks} from "@/component/widget/article/_function/remark-links";

// 운영체제 경로 계약의 재현, 실행 중인 macOS와 Linux에서도 Windows 구분자 검증
vi.mock("node:path", async (importOriginal) => {
    const path = await importOriginal<typeof import("node:path")>();

    return {...path, dirname: path.win32.dirname, relative: path.win32.relative, resolve: path.win32.resolve, sep: path.win32.sep};
});

describe("Windows 문서 링크", () => {
    test.each([
        {source: "../intro.md?lang=ko#start", target: "/guides/intro/?lang=ko#start"},
        {source: "../../../README.md#start", target: "/#start"},
        {source: "child.mdx", target: "/guides/advanced/child/"},
    ])("$source 입력은 사이트 루트 기준 주소를 유지한다", (scenario) => {
        /**
         * GIVEN
         * Windows 경로의 공개 범위, 중첩 문서와 상대 링크
         */
        const tree: Root = {type: "root", children: [{type: "paragraph", children: [{type: "link", url: scenario.source, children: [{type: "text", value: "Guide"}]}]}]};
        const file = new VFile({path: "C:\\docs\\public\\guides\\advanced\\current.md"});

        /**
         * WHEN
         * Markdown 상대 링크 변환
         */
        remarkLinks({scope: {root: "C:\\docs", publicRoot: "C:\\docs\\public", privateRoot: "C:\\docs\\private", includePrivate: false}})(tree, file);

        const result = tree.children[0];

        /**
         * THEN
         * 상위 경로, 쿼리, 앵커 유지
         */
        expect(result).toHaveProperty("children.0.url", scenario.target);
    });
});

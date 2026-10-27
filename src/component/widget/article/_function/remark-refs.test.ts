import type {Link, Root} from "mdast";
import {describe, expect, test} from "vitest";
import {remarkRefs} from "@/component/widget/article/_function/remark-refs";

/**
 * 참조 칩 class(src/component/widget/article/_function/remark-refs.ts) 검증
 */
describe("참조 칩", () => {
    describe("접두와 번호인 링크 글자", () => {
        const toTree = (text: string): Root => {
            return {type: "root", children: [{type: "paragraph", children: [{type: "link", url: "../questions.md#q3", children: [{type: "text", value: text}]}]}]};
        };

        const toLink = (tree: Root): Link => {
            return (tree.children[0] as {children: Link[]}).children[0];
        };

        test.each([
            {text: "Q3", className: ["wg_article__ref", "wg_article__ref--violet"]},
            {text: "BE12", className: ["wg_article__ref", "wg_article__ref--gray"]},
        ])("설정 접두의 $text 링크는 색 class 를 단다", (scenario) => {
            /**
             * GIVEN
             * 설정 접두 Q(violet), BE(gray)와 링크 하나
             */
            const tree = toTree(scenario.text);

            /**
             * WHEN
             * 참조 칩 표시
             */
            remarkRefs({
                refs: [
                    {prefix: "Q", color: "violet"},
                    {prefix: "BE", color: "gray"},
                ],
            })(tree);

            /**
             * THEN
             * hProperties 의 class
             */
            expect(toLink(tree).data?.hProperties?.className).toStrictEqual(scenario.className);
        });

        test.each(["Q3a", "q3", "D1", "Q"])("접두와 번호가 아닌 %s 링크는 그대로 둔다", (text) => {
            /**
             * GIVEN
             * 설정 접두 Q와 글자가 다른 링크
             */
            const tree = toTree(text);

            /**
             * WHEN
             * 참조 칩 표시
             */
            remarkRefs({refs: [{prefix: "Q", color: "violet"}]})(tree);

            /**
             * THEN
             * 데이터 없음
             */
            expect(toLink(tree).data).toBeUndefined();
        });
    });
});

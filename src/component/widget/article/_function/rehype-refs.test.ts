import type {Element, Root} from "hast";
import {describe, expect, test} from "vitest";
import {rehypeRefs} from "@/component/widget/article/_function/rehype-refs";

/**
 * 참조 칩 class(src/component/widget/article/_function/rehype-refs.ts) 검증
 */
describe("참조 칩", () => {
    const refs = [
        {prefix: "Q", color: "violet"},
        {prefix: "BE", color: "gray"},
    ] as const;

    const toLinkTree = (text: string): Root => {
        return {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "p",
                    properties: {},
                    children: [{type: "element", tagName: "a", properties: {href: "/questions/#q3"}, children: [{type: "text", value: text}]}],
                },
            ],
        };
    };

    const toHeadingTree = (text: string): Root => {
        return {
            type: "root",
            children: [
                {
                    type: "element",
                    tagName: "h3",
                    properties: {id: text.toLowerCase()},
                    children: [{type: "element", tagName: "span", properties: {className: ["wg_article__headingText"]}, children: [{type: "text", value: text}]}],
                },
            ],
        };
    };

    const toFirstChild = (tree: Root): Element => {
        return (tree.children[0] as Element).children[0] as Element;
    };

    describe("접두와 번호인 링크 글자", () => {
        test.each([
            {text: "Q3", className: ["wg_article__ref", "wg_article__ref--violet"]},
            {text: "BE12", className: ["wg_article__ref", "wg_article__ref--gray"]},
        ])("설정 접두의 $text 링크는 색 class 를 단다", (scenario) => {
            /**
             * GIVEN
             * 설정 접두 Q(violet), BE(gray)와 링크 하나
             */
            const tree = toLinkTree(scenario.text);

            /**
             * WHEN
             * 참조 칩 표시
             */
            rehypeRefs({refs: [...refs]})(tree);

            /**
             * THEN
             * 링크의 class
             */
            expect(toFirstChild(tree).properties.className).toStrictEqual(scenario.className);
        });

        test.each(["Q3a", "q3", "D1", "Q"])("접두와 번호가 아닌 %s 링크는 그대로 둔다", (text) => {
            /**
             * GIVEN
             * 설정 접두 Q와 글자가 다른 링크
             */
            const tree = toLinkTree(text);

            /**
             * WHEN
             * 참조 칩 표시
             */
            rehypeRefs({refs: [...refs]})(tree);

            /**
             * THEN
             * class 없음
             */
            expect(toFirstChild(tree).properties.className).toBeUndefined();
        });
    });

    describe("접두와 번호인 제목", () => {
        test("번호 하나인 제목의 안쪽 span 은 제목용 칩 class 를 단다", () => {
            /**
             * GIVEN
             * rehype-heading-ids 가 감싼 제목 B9
             */
            const tree = toHeadingTree("BE9");

            /**
             * WHEN
             * 참조 칩 표시
             */
            rehypeRefs({refs: [...refs]})(tree);

            /**
             * THEN
             * 기존 class 뒤에 칩 class
             */
            expect(toFirstChild(tree).properties.className).toStrictEqual(["wg_article__headingText", "wg_article__ref", "wg_article__ref--heading", "wg_article__ref--gray"]);
        });

        test("번호가 아닌 제목은 그대로 둔다", () => {
            /**
             * GIVEN
             * 보통 제목
             */
            const tree = toHeadingTree("Pattern detail");

            /**
             * WHEN
             * 참조 칩 표시
             */
            rehypeRefs({refs: [...refs]})(tree);

            /**
             * THEN
             * 감싼 class 만
             */
            expect(toFirstChild(tree).properties.className).toStrictEqual(["wg_article__headingText"]);
        });
    });
});

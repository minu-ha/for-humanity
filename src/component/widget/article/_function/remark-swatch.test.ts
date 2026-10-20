import type {InlineCode, Root} from "mdast";
import {describe, expect, test} from "vitest";
import {remarkSwatch} from "@/component/widget/article/_function/remark-swatch";

describe("색 견본", () => {
    describe("16진수 색상 길이", () => {
        test.for([
            {color: "#e80", expected: true},
            {color: "#e80f", expected: true},
            {color: "#e80030", expected: true},
            {color: "#e80030ff", expected: true},
            {color: "#12", expected: false},
            {color: "#12345", expected: false},
            {color: "#1234567", expected: false},
        ])("$color 코드의 견본 표시 여부는 $expected 값이다", (scenario) => {
            /**
             * GIVEN
             * 색상 값 하나의 인라인 코드
             */
            const code: InlineCode = {type: "inlineCode", value: scenario.color};
            const tree: Root = {type: "root", children: [{type: "paragraph", children: [code]}]};

            /**
             * WHEN
             * 색 견본 변환
             */
            remarkSwatch()(tree);

            /**
             * THEN
             * CSS 16진수 길이의 값만 견본 표시
             */
            expect(code.data !== undefined).toBe(scenario.expected);
        });
    });
});

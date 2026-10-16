import {
    transformerMetaHighlight,
    transformerNotationDiff,
    transformerNotationErrorLevel,
    transformerNotationHighlight,
    transformerNotationWordHighlight,
} from "@shikijs/transformers";
import type {Element, ElementContent} from "hast";
import type {ShikiTransformer} from "shiki";

/**
 * line-numbers 메타의 줄 번호 표시, 번호 계산은 CSS counter 사용
 */
const lineNumbers: ShikiTransformer = {
    name: "for-humanity:line-numbers",
    pre(node) {
        const meta = this.options.meta?.__raw;

        if (typeof meta === "string" && /\bline-numbers\b/.test(meta)) {
            this.addClassToHast(node, "wg_prose__lineNumbers");
        }
    },
};

/**
 * bad, good 메타의 코드 상태 클래스, 색상은 token.css 소유
 */
const tone: ShikiTransformer = {
    name: "for-humanity:code-tone",
    pre(node) {
        const meta = this.options.meta?.__raw;

        if (typeof meta !== "string") {
            return;
        }

        for (const word of ["bad", "good"]) {
            if (new RegExp(`\\b${word}\\b`).test(meta)) {
                this.addClassToHast(node, `wg_prose__code--${word}`);
            }
        }
    },
};

/**
 * 파일 이름 메타의 코드 제목 생성
 *
 *   - 제목 띠에 파일 이름과 언어 표시
 *   - 코드와 figure에 같은 상태 클래스 적용
 */
const fileTitle: ShikiTransformer = {
    name: "for-humanity:code-title",
    root(root) {
        const meta = this.options.meta?.__raw;
        const title = typeof meta === "string" ? /\[([^\]]+)\]/.exec(meta)?.[1] : undefined;

        if (title === undefined) {
            return;
        }

        const tones = typeof meta === "string" ? ["bad", "good"].filter((word) => new RegExp(`\\b${word}\\b`).test(meta)) : [];
        const caption: Element = {
            type: "element",
            tagName: "figcaption",
            properties: {className: ["wg_prose__codeFileTitle"]},
            children: [
                {type: "text", value: title},
                {type: "element", tagName: "span", properties: {className: ["wg_prose__codeFileLang"]}, children: [{type: "text", value: this.options.lang}]},
            ],
        };
        const figure: Element = {
            type: "element",
            tagName: "figure",
            properties: {className: ["wg_prose__codeFile", ...tones.map((tone) => `wg_prose__codeFile--${tone}`)]},
            children: [caption, ...root.children.filter((child): child is ElementContent => child.type !== "doctype")],
        };

        root.children = [figure];
    },
};

/**
 * 코드 메타와 줄 지시문의 Shiki 변환기 순서
 */
export const shikiTransformers: ShikiTransformer[] = [
    transformerNotationHighlight({matchAlgorithm: "v3"}),
    transformerNotationErrorLevel({matchAlgorithm: "v3"}),
    transformerNotationDiff({matchAlgorithm: "v3"}),
    transformerNotationWordHighlight({matchAlgorithm: "v3"}),
    transformerMetaHighlight(),
    lineNumbers,
    tone,
    fileTitle,
];

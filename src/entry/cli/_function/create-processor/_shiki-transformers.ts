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
 * 펜스 메타에 `line-numbers` 가 있으면 pre 에 줄 번호 클래스 · 번호는 CSS counter
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
 * 펜스 메타 `bad`·`good` → pre 에 블록 색 클래스 · 바탕색은 token.css 가 바꿈
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
 * 펜스 메타 `[파일 이름]` → figure 로 감싸고 제목 띠에 파일 이름과 언어 · 블록 색 클래스는 figure 에도 둠
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
 * 코드 줄 표기 · `// [!code highlight|error|warning|++|--]`, `// [!code word:x]`, 메타 `{2,4-6}`, `line-numbers`, 블록 색 `bad`·`good`, 제목 `[파일 이름]`
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

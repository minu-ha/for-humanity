import {
    transformerMetaHighlight,
    transformerNotationDiff,
    transformerNotationErrorLevel,
    transformerNotationHighlight,
    transformerNotationWordHighlight,
} from "@shikijs/transformers";
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
 * 코드 줄 표기 · `// [!code highlight|error|warning|++|--]`, `// [!code word:x]`, 메타 `{2,4-6}`, `line-numbers`
 */
export const shikiTransformers: ShikiTransformer[] = [
    transformerNotationHighlight({matchAlgorithm: "v3"}),
    transformerNotationErrorLevel({matchAlgorithm: "v3"}),
    transformerNotationDiff({matchAlgorithm: "v3"}),
    transformerNotationWordHighlight({matchAlgorithm: "v3"}),
    transformerMetaHighlight(),
    lineNumbers,
];

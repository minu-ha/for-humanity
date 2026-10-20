import {
    transformerMetaHighlight,
    transformerNotationDiff,
    transformerNotationErrorLevel,
    transformerNotationHighlight,
    transformerNotationWordHighlight,
} from "@shikijs/transformers";
import type {ElementContent} from "hast";
import type {ShikiTransformer} from "shiki";

/**
 * 코드 메타의 줄 번호, 상태, 파일 제목 생성
 *
 *   - 메타 부재는 진입점에서만 확인, 상태 판정은 코드와 제목에 공유
 *   - 코드 상자의 색상은 소유 CSS에서 지정, 토큰별 Shiki 색상은 유지
 *   - 예외: ShikiTransformer.root의 호출 컨텍스트로 pre와 언어 조회, this 보존
 */
const codeMetadata: ShikiTransformer = {
    name: "for-humanity:code-metadata",
    root(root) {
        this.pre.properties.style = undefined;
        this.addClassToHast(this.pre, "wg_article__code");

        if (this.options.meta?.__raw === undefined) {
            return;
        }

        // 줄 번호, 상태 판정은 파일 제목을 제외한 메타 기준
        const flags = this.options.meta.__raw.replace(/\[[^\]]+\]/, " ");

        if (/\bline-numbers\b/.test(flags)) {
            this.addClassToHast(this.pre, "wg_article__lineNumbers");
        }

        const isBad = /\bbad\b/.test(flags);
        const isGood = /\bgood\b/.test(flags);

        if (isBad) {
            this.addClassToHast(this.pre, "wg_article__code--bad");
        }

        if (isGood) {
            this.addClassToHast(this.pre, "wg_article__code--good");
        }

        const title = /\[([^\]]+)\]/.exec(this.options.meta.__raw)?.[1];

        if (title === undefined) {
            return;
        }

        root.children = [
            {
                type: "element",
                tagName: "figure",
                properties: {className: ["wg_article__codeFile"]},
                children: [
                    {
                        type: "element",
                        tagName: "figcaption",
                        properties: {
                            className: ["wg_article__codeFileTitle", ...(isBad ? ["wg_article__codeFileTitle--bad"] : []), ...(isGood ? ["wg_article__codeFileTitle--good"] : [])],
                        },
                        children: [
                            {type: "text", value: title},
                            {type: "element", tagName: "span", properties: {className: ["wg_article__codeFileLang"]}, children: [{type: "text", value: this.options.lang}]},
                        ],
                    },
                    ...root.children.filter((child): child is ElementContent => child.type !== "doctype"),
                ],
            },
        ];
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
    codeMetadata,
];

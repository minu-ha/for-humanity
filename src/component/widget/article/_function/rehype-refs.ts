import type {Element, Root} from "hast";
import {toString as toPlainText} from "hast-util-to-string";
import {visit} from "unist-util-visit";
import {ref_text_pattern} from "@/constant/ref";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 참조 칩으로 바꿀 설정 접두
 */
interface RefOptions {
    /**
     * 사이트 설정의 접두와 색
     */
    refs: ResolvedSiteConfig["refs"];
}

/**
 * 제목 요소 이름
 */
const heading_pattern = /^h[1-6]$/;

/**
 * @helper 요소의 class 목록. 문자열, 배열, 없음을 배열로
 */
const toClassList = (node: Element): string[] => {
    const value = node.properties.className;

    if (Array.isArray(value)) {
        return value.map(String);
    }

    return typeof value === "string" ? [value] : [];
};

/**
 * 글자가 접두와 번호인 링크와 제목의 참조 칩 class
 *
 *   - 링크는 글자가 텍스트 하나이고 설정 접두 뒤 숫자일 때만. 주소는 그대로
 *   - 제목은 rehype-heading-ids 가 감싼 안쪽 span 에. 본문 칩과 그 앵커가 같은 모양
 */
export const rehypeRefs = (options: RefOptions) => {
    const colorByPrefix = new Map(options.refs.map((ref) => [ref.prefix, ref.color]));

    const toColor = (text: string) => {
        const match = ref_text_pattern.exec(text.trim());

        return match === null ? undefined : colorByPrefix.get(match[1]);
    };

    return (tree: Root) => {
        if (colorByPrefix.size === 0) {
            return;
        }

        visit(tree, "element", (node) => {
            if (node.tagName === "a") {
                const [child] = node.children;

                if (node.children.length !== 1 || child.type !== "text") {
                    return;
                }

                const color = toColor(child.value);

                if (color === undefined) {
                    return;
                }

                node.properties.className = [...toClassList(node), "wg_article__ref", `wg_article__ref--${color}`];

                return;
            }

            if (!heading_pattern.test(node.tagName)) {
                return;
            }

            const [span] = node.children;

            if (node.children.length !== 1 || span.type !== "element" || span.tagName !== "span") {
                return;
            }

            const color = toColor(toPlainText(span));

            if (color === undefined) {
                return;
            }

            span.properties.className = [...toClassList(span), "wg_article__ref", "wg_article__ref--heading", `wg_article__ref--${color}`];
        });
    };
};

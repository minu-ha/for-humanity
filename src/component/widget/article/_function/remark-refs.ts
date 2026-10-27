import type {Root} from "mdast";
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
 * 글자가 접두와 번호인 링크의 참조 칩 class
 *
 *   - 링크 글자가 텍스트 하나이고 설정 접두 뒤 숫자일 때만. 주소는 그대로
 */
export const remarkRefs = (options: RefOptions) => {
    const colorByPrefix = new Map(options.refs.map((ref) => [ref.prefix, ref.color]));

    return (tree: Root) => {
        if (colorByPrefix.size === 0) {
            return;
        }

        visit(tree, "link", (node) => {
            const [child] = node.children;

            if (node.children.length !== 1 || child.type !== "text") {
                return;
            }

            const match = ref_text_pattern.exec(child.value);

            if (match === null) {
                return;
            }

            const color = colorByPrefix.get(match[1]);

            if (color === undefined) {
                return;
            }

            node.data = {...node.data, hProperties: {...node.data?.hProperties, className: ["wg_article__ref", `wg_article__ref--${color}`]}};
        });
    };
};

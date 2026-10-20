import type {Root} from "mdast";
import {visit} from "unist-util-visit";

/**
 * 인라인 hex 색 값의 칩 표시
 *
 *   - 문서별 색은 --wg-article-chip-color로 전달. 고정 스타일시트 값 불가
 */
export const remarkSwatch = () => (tree: Root) => {
    visit(tree, "inlineCode", (node) => {
        const color = node.value.trim();

        if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) {
            node.data = {hProperties: {className: ["wg_article__color"], style: `--wg-article-chip-color: ${color}`}};
        }
    });
};

import type {Root} from "mdast";
import {visit} from "unist-util-visit";

/**
 * 인라인 hex 색 값의 칩 표시
 * 문서별 색은 --wg-prose-chip-color로 전달 · 고정 스타일시트 값 불가
 */
export const remarkSwatch = () => (tree: Root) => {
	visit(tree, "inlineCode", (node) => {
		if (/^#[0-9a-f]{3,8}$/i.test(node.value.trim())) {
			node.data = {hProperties: {className: ["wg_prose__color"], style: `--wg-prose-chip-color: ${node.value.trim()}`}};
		}
	});
};

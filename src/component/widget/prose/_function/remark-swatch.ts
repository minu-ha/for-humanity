import type {Root} from "mdast";
import {visit} from "unist-util-visit";

/**
 * 색 칩. 색 값 하나만 든 코드 (`#e80030`) 앞에 그 색을 칠한다.
 * 색은 문서마다 달라 스타일시트에 미리 적을 수 없으므로 CSS 변수 하나로만 넘긴다
 */
export const remarkSwatch = () => (tree: Root) => {
	visit(tree, "inlineCode", (node) => {
		if (/^#[0-9a-f]{3,8}$/i.test(node.value.trim())) {
			node.data = {hProperties: {className: ["wg_prose__color"], style: `--wg-prose-chip-color: ${node.value.trim()}`}};
		}
	});
};

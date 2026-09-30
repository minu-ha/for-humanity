import type {Root} from "hast";
import {SKIP, visit} from "unist-util-visit";

/**
 * 표 상자. 넓은 표는 상자 안에서 가로로 민다
 */
export const rehypeTables = () => (tree: Root) => {
	visit(tree, "element", (node, index, parent) => {
		if (node.tagName !== "table" || parent === undefined || index === undefined) {
			return;
		}

		parent.children[index] = {
			type: "element",
			tagName: "div",
			properties: {className: ["wg_prose__table"]},
			children: [node],
		};

		return [SKIP, index + 1];
	});
};

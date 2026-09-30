import type {Root} from "mdast";
import {toString as toPlainText} from "mdast-util-to-string";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";

/**
 * 가름. `::part[이름]` 줄을 가름 머리로 그리고, 바로 다음 절 (h2) 에 data-part 로 가름 이름을 단다.
 * 목차는 rehype-sections 가 data-part 를 읽어 같은 자리에서 끊는다
 */
export const remarkParts = () => (tree: Root) => {
	for (const [index, node] of tree.children.entries()) {
		if (node.type !== "leafDirective" || node.name !== "part") {
			continue;
		}

		const section = tree.children
			.slice(index + 1)
			.find((next) => next.type === "heading" && next.depth === section_heading_depth.section);

		node.data = {hName: "div", hProperties: {className: ["wg_prose__part"]}};

		if (section) {
			section.data = {...section.data, hProperties: {...section.data?.hProperties, dataPart: toPlainText(node).trim()}};
		}
	}
};

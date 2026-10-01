import type {Root} from "mdast";
import {toString as toPlainText} from "mdast-util-to-string";
import {visit} from "unist-util-visit";
import {
	island_attribute_name,
	island_attribute_props,
	island_directive_note,
} from "@/component/widget/island/_constant/island";

/**
 * 섬. `::note[단추 글]` 줄을 브라우저에서 React 가 이어받는 자리로 바꾼다.
 * 서버는 render-islands 가, 브라우저는 island.tsx 가 같은 컴포넌트를 이 자리에 그린다
 */
export const remarkIslands = () => (tree: Root) => {
	visit(tree, "leafDirective", (node) => {
		if (node.name !== island_directive_note) {
			return;
		}

		node.data = {
			hName: "div",
			hProperties: {
				[island_attribute_name]: island_directive_note,
				[island_attribute_props]: encodeURIComponent(JSON.stringify({label: toPlainText(node)})),
			},
		};
	});
};

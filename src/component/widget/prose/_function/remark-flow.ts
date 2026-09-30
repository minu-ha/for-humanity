import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_flow} from "@/constant/copy";
import {renderFlow} from "@/util/mermaid/render-flow";

/**
 * 흐름도. ```mermaid 원문을 beautiful-mermaid 격자 SVG 로 바꾼다. 그리지 못하면 파일과 줄을 들어 빌드를 멈춘다
 */
export const remarkFlow = () => (tree: Root, file: VFile) => {
	visit(tree, "code", (node, index, parent) => {
		if (node.lang !== "mermaid" || parent === undefined || index === undefined) {
			return;
		}

		try {
			parent.children[index] = {type: "html", value: `<div class="wg_prose__flow">${renderFlow(node.value)}</div>`};
		} catch (error) {
			file.fail(`${copy_error_flow}: ${error instanceof Error ? error.message : String(error)}`, node);
		}
	});
};

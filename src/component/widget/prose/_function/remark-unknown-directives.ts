import type {Root} from "mdast";
import {SKIP, visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_unknown_directive} from "@/constant/copy";

/**
 * hName 없는 블록 지시문은 작성 오류
 * textDirective는 원문 복원 · 예:이것 같은 일반 문장의 오인 방지
 */
export const remarkUnknownDirectives = () => (tree: Root, file: VFile) => {
	visit(tree, (node, index, parent) => {
		if (node.type === "textDirective" && parent !== undefined && index !== undefined) {
			parent.children[index] = {
				type: "text",
				value: String(file.value).slice(node.position?.start.offset, node.position?.end.offset),
			};

			return SKIP;
		}

		if ((node.type === "leafDirective" || node.type === "containerDirective") && node.data?.hName === undefined) {
			file.fail(`${copy_error_unknown_directive}: ${node.name}`, node);
		}
	});
};

import type {Root} from "mdast";
import {SKIP, visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_unknown_directive} from "@/constant/copy";

/**
 * 맡은 플러그인이 없는 지시문. 앞의 플러그인은 맡은 지시문에 hName 을 달았으니, 남은 블록 지시문은 오타다.
 * 글 속의 `:` 뒤 낱말 (textDirective) 은 원문으로 되돌린다. "예:이것" 같은 글이 지시문으로 읽히는 것을 막는다
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

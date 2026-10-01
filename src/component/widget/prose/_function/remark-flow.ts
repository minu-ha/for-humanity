import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_flow} from "@/constant/copy";
import {renderFlow} from "@/util/mermaid/render-flow";

/**
 * Mermaid → 격자 SVG · beautiful-mermaid 기반
 * 실패 시 파일·줄을 포함한 빌드 오류
 */
export const remarkFlow = () => (tree: Root, file: VFile) => {
    visit(tree, "code", (node, index, parent) => {
        if (node.lang !== "mermaid" || parent === undefined || index === undefined) {
            return;
        }

        try {
            parent.children[index] = {
                type: "html",
                value: `<div class="wg_prose__flow">${renderFlow(node.value)}</div>`,
            };
        } catch (error) {
            file.fail(`${copy_error_flow}: ${error instanceof Error ? error.message : String(error)}`, node);
        }
    });
};

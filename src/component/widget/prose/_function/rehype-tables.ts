import type {Root} from "hast";
import {SKIP, visit} from "unist-util-visit";

/**
 * 넓은 표의 내부 가로 스크롤 래퍼
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

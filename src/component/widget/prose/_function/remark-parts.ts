import type {Root} from "mdast";
import {toString as toPlainText} from "mdast-util-to-string";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";

/**
 * ::part[이름]의 본문 가름과 다음 h2의 data-part
 * rehype-sections에서 같은 지점의 목차 묶음 생성
 */
export const remarkParts = () => (tree: Root) => {
    for (const [index, node] of tree.children.entries()) {
        if (node.type !== "leafDirective" || node.name !== "part") {
            continue;
        }

        const section = tree.children.slice(index + 1).find((next) => next.type === "heading" && next.depth === section_heading_depth.section);

        node.data = {hName: "div", hProperties: {className: ["wg_prose__part"]}};

        if (section) {
            section.data = {
                ...section.data,
                hProperties: {...section.data?.hProperties, dataPart: toPlainText(node).trim()},
            };
        }
    }
};

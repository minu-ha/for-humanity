import type {Root} from "mdast";
import {toString as toPlainText} from "mdast-util-to-string";
import type {VFile} from "vfile";
import {copy_error_directive_syntax, copy_error_part_empty_title} from "@/component/widget/article/_constant/copy";
import {section_heading_depth} from "@/component/widget/article/_constant/section";

/**
 * ::part[이름]의 본문 가름과 다음 h2의 data-part
 *
 *   - rehype-sections에서 같은 지점의 목차 묶음 생성
 *   - 이름 생략, 빈 이름은 빌드 실패. 빈 가름과 빈 목차 묶음 방지
 */
export const remarkParts = () => (tree: Root, file: VFile) => {
    for (const [index, node] of tree.children.entries()) {
        if (node.type !== "leafDirective" || node.name !== "part") {
            continue;
        }

        const title = toPlainText(node).trim();

        if (title === "") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_empty_title}`, node);
        }

        const section = tree.children.slice(index + 1).find((next) => next.type === "heading" && next.depth === section_heading_depth.section);

        node.data = {hName: "div", hProperties: {className: ["wg_article__part"]}};

        if (section) {
            section.data = {
                ...section.data,
                hProperties: {...section.data?.hProperties, dataPart: title},
            };
        }
    }
};

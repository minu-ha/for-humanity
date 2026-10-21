import type {Root} from "mdast";
import type {VFile} from "vfile";
import {
    copy_error_directive_syntax,
    copy_error_part_attribute,
    copy_error_part_attribute_syntax,
    copy_error_part_empty_title,
    copy_error_part_plain_title,
    copy_error_part_section,
} from "@/component/widget/article/_constant/copy";
import {section_heading_depth} from "@/component/widget/article/_constant/section";
import {toTitleText} from "@/component/widget/article/_function/to-title-text";

/**
 * ::part[이름]의 본문 가름과 다음 h2의 data-part
 *
 *   - rehype-sections에서 같은 지점의 목차 묶음 생성
 *   - 이름 생략, 빈 이름, 서식, 속성은 빌드 실패. Note, Details 제목과 같은 계약
 *   - 다음 part나 문서 끝 전의 ## 절 필수. 목차 묶음 누락 방지
 */
export const remarkParts = () => (tree: Root, file: VFile) => {
    const source = String(file.value);

    for (const [index, node] of tree.children.entries()) {
        if (node.type !== "leafDirective" || node.name !== "part") {
            continue;
        }

        const title = toTitleText(node.children, source);

        if (title === undefined) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_plain_title}`, node);
        }

        if (title === "") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_empty_title}`, node);
        }

        const attribute = node.attributes ? Object.keys(node.attributes).at(0) : undefined;

        if (attribute !== undefined) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_attribute} ${attribute}`, node);
        }

        // 속성 정규화 이전의 표기. 빈 중괄호 거부
        if (/\}\s*$/.test(source.slice(node.position?.start.offset, node.position?.end.offset))) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_attribute_syntax}`, node);
        }

        const section = tree.children
            .slice(index + 1)
            .find((next) => (next.type === "heading" && next.depth === section_heading_depth.section) || (next.type === "leafDirective" && next.name === "part"));

        if (section?.type !== "heading") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_section}`, node);
        }

        node.children = [{type: "text", value: title}];
        node.data = {hName: "div", hProperties: {className: ["wg_article__part"]}};

        section.data = {
            ...section.data,
            hProperties: {...section.data?.hProperties, dataPart: title},
        };
    }
};

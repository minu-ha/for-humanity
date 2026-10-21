import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {
    copy_error_directive_syntax,
    copy_error_part_attribute,
    copy_error_part_attribute_syntax,
    copy_error_part_body,
    copy_error_part_code_fence,
    copy_error_part_container,
    copy_error_part_empty_title,
    copy_error_part_fence,
    copy_error_part_heading,
    copy_error_part_line,
    copy_error_part_plain_title,
    copy_error_part_top_level,
} from "@/component/widget/article/_constant/copy";
import {section_heading_depth} from "@/component/widget/article/_constant/section";
import {toTitleText} from "@/component/widget/article/_function/_to-title-text";
import {hasBlockContent} from "@/component/widget/article/_function/remark-blocks/_has-block-content";

/**
 * Note, Details의 제목, 본문, 속성, 닫힘 계약
 *
 *   - label은 첫 자식, summary는 Details의 첫 요소
 *   - part는 문서 최상위의 ::part[...] 한 줄만 허용
 *   - 원문 위치는 오류 기준
 */
export const remarkBlocks = () => (tree: Root, file: VFile) => {
    const source = String(file.value);

    visit(tree, (node, _index, parent) => {
        if (node.type === "containerDirective" && node.name === "part") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_line}`, node);
        }

        if (node.type === "leafDirective" && node.name === "part" && parent?.type !== "root") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_top_level}`, node);
        }

        if (node.type !== "containerDirective" && node.type !== "leafDirective" && node.type !== "textDirective") {
            return;
        }

        if (node.name !== "note" && node.name !== "details") {
            return;
        }

        if (node.type !== "containerDirective") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_container}`, node);
        }

        const label = node.children.at(0);

        if (label?.type !== "paragraph" || label.data?.directiveLabel !== true) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_plain_title}`, node);
        }

        const title = toTitleText(label.children, source);

        if (title === undefined) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_plain_title}`, node);
        }

        if (title === "") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_empty_title}`, node);
        }

        if (!node.children.slice(1).some(hasBlockContent)) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_body}`, node);
        }

        const unsupported = node.attributes ? Object.keys(node.attributes).find((key) => node.name !== "details" || key !== "open") : undefined;

        if (unsupported !== undefined) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_attribute} ${unsupported}`, node);
        }

        const attributeSource = source.slice(label.position?.end.offset, node.position?.end.offset).split(/\r?\n/, 1)[0].trim();

        // 속성 정규화 이전의 표기. 중복 open과 open="" 거부
        if (attributeSource !== "" && (node.name !== "details" || !/^\{[ \t]*open[ \t]*\}$/.test(attributeSource))) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_attribute_syntax}`, node);
        }

        const original = source.slice(node.position?.start.offset, node.position?.end.offset);
        const opening = /^(:{3,})/.exec(original);
        const closing = /(?:^|\n)[ \t>]*(:{3,})[ \t]*\r?$/.exec(original);

        if (opening === null || closing === null || closing[1].length < opening[1].length || node.position?.end.offset === node.children.at(-1)?.position?.end.offset) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_fence}`, node);
        }

        visit(node, "heading", (heading) => {
            if (heading.depth <= section_heading_depth.section) {
                file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_heading}`, heading);
            }
        });

        // 코드 안의 :::가 container를 먼저 닫은 경우. 더 긴 바깥 fence로 구분
        visit(node, "code", (code) => {
            // 원문 위치가 없는 스니펫 삽입 코드는 fence 검사 제외
            if (code.position === undefined) {
                return;
            }

            const originalCode = source.slice(code.position.start.offset, code.position.end.offset);
            const codeOpening = /^ {0,3}(`{3,}|~{3,})/.exec(originalCode);
            const codeClosing = /(?:^|\n)[ \t>]*(`{3,}|~{3,})[ \t]*\r?$/.exec(originalCode);

            if (codeOpening !== null && (codeClosing === null || codeClosing[1][0] !== codeOpening[1][0] || codeClosing[1].length < codeOpening[1].length)) {
                file.fail(`${copy_error_directive_syntax}: ${node.name} ${copy_error_part_code_fence}`, code);
            }
        });

        label.children = [{type: "text", value: title}];

        label.data = {
            ...label.data,
            hName: node.name === "note" ? "strong" : "summary",
            hProperties: {className: [node.name === "note" ? "wg_article__noteTitle" : "wg_article__detailsSummary"]},
        };

        node.data = {
            ...node.data,
            hName: node.name === "note" ? "aside" : "details",
            hProperties: node.name === "note" ? {className: ["wg_article__note"], ariaLabel: title} : {className: ["wg_article__details"], open: node.attributes?.open === ""},
        };
    });
};

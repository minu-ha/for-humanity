import type {Root} from "mdast";
import {toString as toPlainText} from "mdast-util-to-string";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";
import {hasBlockContent} from "@/component/widget/prose/_function/has-block-content";
import {copy_error_directive_syntax} from "@/constant/copy";

/**
 * Note·Details의 제목·본문·속성·닫힘 계약
 * label은 첫 자식 · summary는 Details의 첫 요소 · 원문 위치는 오류 기준
 */
export const remarkBlocks = () => (tree: Root, file: VFile) => {
    const source = String(file.value);

    visit(tree, (node, _index, parent) => {
        if (node.type === "leafDirective" && node.name === "part" && parent?.type !== "root") {
            file.fail(`${copy_error_directive_syntax}: part · 문서 최상위에 작성`, node);
        }

        if (node.type !== "containerDirective" && node.type !== "leafDirective" && node.type !== "textDirective") {
            return;
        }

        if (node.name !== "note" && node.name !== "details") {
            return;
        }

        if (node.type !== "containerDirective") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} · ::: 블록으로 작성`, node);
        }

        const label = node.children.at(0);

        if (label?.type !== "paragraph" || label.data?.directiveLabel !== true || label.children.some((child) => child.type !== "text")) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} · 일반 텍스트 제목 필수`, node);
        }

        const title = toPlainText(label).trim();

        if (title === "") {
            file.fail(`${copy_error_directive_syntax}: ${node.name} · 비어 있지 않은 제목 필수`, node);
        }

        if (!node.children.slice(1).some(hasBlockContent)) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} · 본문 필수`, node);
        }

        const unsupported = node.attributes ? Object.keys(node.attributes).find((key) => node.name !== "details" || key !== "open") : undefined;

        if (unsupported !== undefined) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} · 미지원 속성 ${unsupported}`, node);
        }

        const open = node.attributes?.open;
        const attributeSource = source.slice(label.position?.end.offset, node.position?.end.offset).split(/\r?\n/, 1)[0].trim();

        // 속성 정규화 이전의 표기 · 중복 open과 open="" 거부
        if (attributeSource !== "" && (node.name !== "details" || !/^\{[ \t]*open[ \t]*\}$/.test(attributeSource))) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} · 허용 속성은 Details의 {open}, 나머지는 생략`, node);
        }

        const original = source.slice(node.position?.start.offset, node.position?.end.offset);
        const opening = /^(:{3,})/.exec(original);
        const closing = /(?:^|\n)[ \t>]*(:{3,})[ \t]*\r?$/.exec(original);

        if (
            opening === null ||
            closing === null ||
            closing.index + closing[0].length !== original.length ||
            closing[1].length < opening[1].length ||
            node.position?.end.offset === node.children.at(-1)?.position?.end.offset
        ) {
            file.fail(`${copy_error_directive_syntax}: ${node.name} · 블록을 닫는 fence 필수`, node);
        }

        visit(node, "heading", (heading) => {
            if (heading.depth <= section_heading_depth.section) {
                file.fail(`${copy_error_directive_syntax}: ${node.name} · #·## 제목은 부품 밖에 작성`, heading);
            }
        });

        // 코드 안의 :::가 container를 먼저 닫은 경우 · 더 긴 바깥 fence로 구분
        visit(node, "code", (code) => {
            const originalCode = source.slice(code.position?.start.offset, code.position?.end.offset);
            const codeOpening = /^ {0,3}(`{3,}|~{3,})/.exec(originalCode);
            const codeClosing = /(?:^|\n)[ \t>]*(`{3,}|~{3,})[ \t]*\r?$/.exec(originalCode);

            if (
                codeOpening !== null &&
                (codeClosing === null ||
                    codeClosing.index + codeClosing[0].length !== originalCode.length ||
                    codeClosing[1][0] !== codeOpening[1][0] ||
                    codeClosing[1].length < codeOpening[1].length)
            ) {
                file.fail(`${copy_error_directive_syntax}: ${node.name} · 코드 fence를 닫고, 코드 안의 :보다 긴 바깥 fence 사용`, code);
            }
        });

        label.children = [{type: "text", value: title}];
        label.data = {
            ...label.data,
            hName: node.name === "note" ? "strong" : "summary",
            hProperties: {className: [node.name === "note" ? "wg_prose__noteTitle" : "wg_prose__detailsSummary"]},
        };
        node.data = {
            ...node.data,
            hName: node.name === "note" ? "aside" : "details",
            hProperties: node.name === "note" ? {className: ["wg_prose__note"], ariaLabel: title} : {className: ["wg_prose__details"], open: open === ""},
        };
    });
};

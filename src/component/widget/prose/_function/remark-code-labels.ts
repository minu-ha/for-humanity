import type {Root} from "mdast";
import {visit} from "unist-util-visit";

/**
 * 펜스 메타의 라벨 · `bad 제목`, `good 제목` · 제목은 선택
 */
const code_label_pattern = /^(bad|good)(?:\s+(.+?))?\s*$/;

/**
 * figure 여는 조각, 코드, 닫는 조각
 */
const inserted_node_count = 3;

/**
 * 제목을 HTML 문자열에 넣기 위한 escape
 */
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * 코드 펜스 메타 `bad`·`good` → 색 띠와 제목이 붙은 figure · 다른 메타는 그대로 둠
 * 코드 노드는 유지해 Shiki 강조를 받고, figure 조각은 마지막 rehype-raw에서 합쳐짐
 */
export const remarkCodeLabels = () => (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
        if (typeof node.meta !== "string" || parent === undefined || index === undefined) {
            return;
        }

        const match = code_label_pattern.exec(node.meta);

        if (match === null) {
            return;
        }

        const [, tone, title] = match;
        const caption = title === undefined ? "" : `<figcaption class="wg_prose__codeLabelTitle">${escapeHtml(title)}</figcaption>`;

        node.meta = null;
        parent.children.splice(index, 1, {type: "html", value: `<figure class="wg_prose__codeLabel wg_prose__codeLabel--${tone}">${caption}`}, node, {
            type: "html",
            value: "</figure>",
        });

        // 끼워 넣은 세 노드 다음부터 계속
        return index + inserted_node_count;
    });
};

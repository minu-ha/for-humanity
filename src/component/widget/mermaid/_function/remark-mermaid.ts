import {escape as escapeHtml} from "es-toolkit/string";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {MermaidAssets} from "@/type/mermaid-assets";

/**
 * 다이어그램 변환의 자원 계약
 */
interface MermaidOptions {
    /**
     * 로컬 Mermaid 런타임, 없으면 원문만 제공
     */
    assets?: MermaidAssets;

    /**
     * 실제 사용한 자원의 URL과 원본 경로 수집
     */
    files: Map<string, string>;
}

/**
 * Mermaid 원문과 브라우저 렌더 영역. JavaScript 비활성 환경에서도 원문 유지
 */
export const remarkMermaid = (options: MermaidOptions) => (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
        if (node.lang !== "mermaid" || parent === undefined || index === undefined) {
            return;
        }

        if (options.assets !== undefined) {
            for (const [url, path] of options.assets.files) {
                options.files.set(url, path);
            }
        }

        parent.children[index] = {
            type: "html",
            value: `<figure class="wg_mermaid__root" data-mermaid${options.assets === undefined ? "" : ` data-mermaid-module="${options.assets.entry}"`}><div class="wg_mermaid__result" hidden></div><pre class="wg_mermaid__source"><code data-mermaid-source>${escapeHtml(node.value)}</code></pre><p class="wg_mermaid__error" role="status" hidden></p></figure>`,
        };
    });
};

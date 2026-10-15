import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {MermaidAssets} from "@/type/mermaid-assets";

/**
 * Mermaid 원문과 브라우저 렌더 영역. JavaScript 비활성 환경에서도 원문 유지
 */
export const remarkMermaid = (options: {assets?: MermaidAssets; files: Map<string, string>}) => (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
        if (node.lang !== "mermaid" || parent === undefined || index === undefined) return;

        if (options.assets !== undefined) {
            for (const [url, path] of options.assets.files) options.files.set(url, path);
        }

        parent.children[index] = {
            type: "html",
            value: `<figure class="wg_mermaid__root" data-mermaid${options.assets === undefined ? "" : ` data-mermaid-module="${options.assets.entry}"`}><div class="wg_mermaid__result" hidden></div><pre class="wg_mermaid__source"><code data-mermaid-source>${node.value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</code></pre><p class="wg_mermaid__error" role="status" hidden></p></figure>`,
        };
    });
};

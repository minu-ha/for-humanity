import type {Root} from "hast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_directive_syntax, copy_error_part_heading} from "@/component/widget/article/_constant/copy";
import {section_heading_depth} from "@/component/widget/article/_constant/section";

/**
 * Note, Details 안의 원시 HTML h1, h2 거부. Markdown #, ##과 같은 부품 계약
 *
 *   - Markdown 제목은 remark-blocks 담당
 *   - 원시 HTML 제목은 rehype-raw 해석 뒤 검사. 오류 위치는 그 제목의 줄
 */
export const rehypeBlocks = () => (tree: Root, file: VFile) => {
    visit(tree, "element", (node) => {
        const classes = node.properties.className;

        if (!Array.isArray(classes) || !(classes.includes("wg_article__note") || classes.includes("wg_article__details"))) {
            return;
        }

        visit(node, "element", (heading) => {
            const depth = /^h([1-6])$/.exec(heading.tagName)?.[1];

            if (depth !== undefined && Number(depth) <= section_heading_depth.section) {
                file.fail(`${copy_error_directive_syntax}: ${classes.includes("wg_article__note") ? "note" : "details"} ${copy_error_part_heading}`, heading);
            }
        });
    });
};

import Slugger from "github-slugger";
import type {Root} from "hast";
import {toString as toPlainText} from "hast-util-to-string";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import type {DocHeading} from "@/type/doc-heading";

/**
 * 제목 id와 목차 수집 · 같은 제목은 -1, -2 접미사
 * 작성한 제목 텍스트를 그대로 사용
 */
export const rehypeHeadingIds = () => (tree: Root, file: VFile) => {
    const slugger = new Slugger();
    const headings: DocHeading[] = [];

    visit(tree, "element", (node) => {
        const depth = /^h([1-6])$/.exec(node.tagName)?.[1];

        if (depth === undefined) {
            return;
        }

        const text = toPlainText(node);

        node.properties.id = typeof node.properties.id === "string" ? node.properties.id : slugger.slug(text);
        headings.push({depth: Number(depth), slug: node.properties.id, text});
        // 텍스트 노드에는 className을 줄 수 없어 강조 영역을 분리 · 제목의 기존 줄바꿈 유지
        node.children = [{type: "element", tagName: "span", properties: {className: ["wg_prose__headingText"]}, children: node.children}];
    });

    if (file.data.fh) {
        file.data.fh.headings = headings;
    }
};

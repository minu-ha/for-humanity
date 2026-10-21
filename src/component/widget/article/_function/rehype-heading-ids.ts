import Slugger from "github-slugger";
import type {Root} from "hast";
import {toString as toPlainText} from "hast-util-to-string";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import type {DocHeading} from "@/type/doc-heading";

/**
 * 제목 id와 목차 수집. 같은 제목은 -1, -2 접미사
 *
 *   - 작성한 제목 텍스트를 그대로 사용
 *   - 작성한 id는 유지, 자동 id는 문서 안의 작성 id와 겹치지 않는 다음 접미사
 */
export const rehypeHeadingIds = () => (tree: Root, file: VFile) => {
    const slugger = new Slugger();
    const headings: DocHeading[] = [];
    const written = new Set<string>();

    // 원시 HTML의 작성 id 선수집. 뒤에 나오는 작성 id와의 중복도 방지
    visit(tree, "element", (node) => {
        if (typeof node.properties.id === "string") {
            written.add(node.properties.id);
        }
    });

    visit(tree, "element", (node) => {
        const depth = /^h([1-6])$/.exec(node.tagName)?.[1];

        if (depth === undefined) {
            return;
        }

        const text = toPlainText(node);

        if (typeof node.properties.id !== "string") {
            let id = slugger.slug(text);

            while (written.has(id)) {
                id = slugger.slug(text);
            }

            node.properties.id = id;
        }

        headings.push({depth: Number(depth), slug: node.properties.id, text});

        // 텍스트 노드의 className 미지원, 별도 강조 요소로 기존 줄바꿈 유지
        node.children = [{type: "element", tagName: "span", properties: {className: ["wg_article__headingText"]}, children: node.children}];
    });

    if (file.data.fh) {
        file.data.fh.headings = headings;
    }
};

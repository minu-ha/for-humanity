import type {Root} from "hast";
import type {VFile} from "vfile";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";

/**
 * name 제목과 첫 절 앞 본문의 공통 머리 · README는 원문의 h1 사용
 */
export const rehypeHead = () => (tree: Root, file: VFile) => {
    const frontmatter = file.data.fh?.frontmatter;

    const firstSection = tree.children.findIndex((node) => node.type === "element" && node.tagName === `h${section_heading_depth.section}`);
    const leadEnd = firstSection === -1 ? tree.children.length : firstSection;

    if (frontmatter === undefined && leadEnd === 0) {
        return;
    }

    tree.children = [
        {
            type: "element",
            tagName: "header",
            properties: {className: ["wg_prose__head"]},
            children: [...tree.children.slice(0, leadEnd).filter((node) => node.type !== "doctype")],
        },
        ...tree.children.slice(leadEnd),
    ];

    if (frontmatter !== undefined && tree.children[0].type === "element") {
        tree.children[0].children.unshift({type: "element", tagName: "h1", properties: {}, children: [{type: "text", value: frontmatter.name}]});
    }
};

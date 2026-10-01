import type {Root} from "hast";
import type {VFile} from "vfile";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";
import {toSectionHeadings} from "@/component/widget/prose/_function/rehype-sections/_to-section-headings";
import {toSectionNumber} from "@/component/widget/prose/_function/rehype-sections/_to-section-number";
import type {DocSection} from "@/component/widget/prose/_type/doc-section";

/**
 * h2 절 번호와 h3 소제목 번호 · 00, 01.A
 * id·목차 텍스트는 앞 단계의 rehype-heading-ids 소유
 * file.data.fh.sections는 headings의 h2·h3 순서와 일치
 */
export const rehypeSections = () => (tree: Root, file: VFile) => {
    if (file.data.fh === undefined) {
        return;
    }

    const headings = toSectionHeadings(tree);
    const starts = headings.flatMap((heading, index) => (heading.tagName === `h${section_heading_depth.section}` ? [index] : []));
    const sections = headings.map(
        (heading, index): DocSection => ({
            number: toSectionNumber(starts, index),
            part: typeof heading.properties.dataPart === "string" ? heading.properties.dataPart : undefined,
        }),
    );

    for (const [index, heading] of headings.entries()) {
        if (sections[index].number !== undefined) {
            heading.children.unshift({
                type: "raw",
                value: `<span class="wg_prose__num">${sections[index].number}</span>`,
            });
        }
    }

    file.data.fh.sections = sections;
};

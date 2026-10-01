import type {Root} from "hast";
import type {VFile} from "vfile";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";
import {toSectionHeadings} from "@/component/widget/prose/_function/rehype-sections/_to-section-headings";
import {toSectionNumber} from "@/component/widget/prose/_function/rehype-sections/_to-section-number";
import type {DocSection} from "@/component/widget/prose/_type/doc-section";

/**
 * 절 번호와 목차 차례. 절 (h2) 은 00 · 01, 소제목 (h3) 은 01.A 꼴이다.
 * 제목 id 와 목차 글자는 앞에서 rehype-heading-ids 가 매겼으므로 여기서 넣는 번호가 섞이지 않는다.
 * 목차가 쓸 번호와 가름은 file.data.fh 에 제목 차례대로 적는다. rehype-heading-ids 가 모은 제목 (문서 순서) 가운데 h2 · h3 과 차례가 같다
 */
export const rehypeSections = () => (tree: Root, file: VFile) => {
	if (file.data.fh === undefined) {
		return;
	}

	const headings = toSectionHeadings(tree);
	const starts = headings.flatMap((heading, index) =>
		heading.tagName === `h${section_heading_depth.section}` ? [index] : [],
	);
	const sections = headings.map(
		(heading, index): DocSection => ({
			number: toSectionNumber(starts, index),
			part: typeof heading.properties.dataPart === "string" ? heading.properties.dataPart : undefined,
		}),
	);

	for (const [index, heading] of headings.entries()) {
		if (sections[index].number !== undefined) {
			heading.children.unshift({type: "raw", value: `<span class="wg_prose__num">${sections[index].number}</span>`});
		}
	}

	file.data.fh.sections = sections;
};

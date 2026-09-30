import type {Root} from "hast";
import type {VFile} from "vfile";
import {section_frontmatter_key, section_heading_depth} from "@/component/widget/prose/_constant/section";
import {toSectionHeadings} from "@/component/widget/prose/_function/rehype-sections/_to-section-headings";
import {toSectionNumber} from "@/component/widget/prose/_function/rehype-sections/_to-section-number";
import type {DocSection} from "@/component/widget/prose/_type/doc-section";

/**
 * 절 번호와 목차 차례. 절 (h2) 은 00 · 01, 소제목 (h3) 은 01.A 꼴이다.
 * 번호는 raw 노드로 넣는다. 뒤에 도는 Astro 의 heading id 와 목차 글자는 raw 노드를 건너뛰어 번호가 섞이지 않는다.
 * 목차가 쓸 번호와 가름은 머리말에 제목 차례대로 적는다. Astro 가 목차 제목을 모으는 차례 (문서 순서의 모든 제목) 와 같다
 */
export const rehypeSections = () => (tree: Root, file: VFile) => {
	const frontmatter = file.data.astro?.frontmatter;

	if (frontmatter === undefined) {
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

	frontmatter[section_frontmatter_key] = sections;
};

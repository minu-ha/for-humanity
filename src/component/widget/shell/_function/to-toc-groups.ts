import {takeWhile} from "es-toolkit/array";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";
import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import type {TocGroup, TocSection} from "@/component/widget/shell/_type/toc-group";

/**
 * 목차 묶음. 절 (h2) 마다 그 밑의 소제목 (h3) 을 모으고, 가름이 달린 절에서 묶음을 끊는다.
 * 첫 절보다 앞에 온 소제목은 들 절이 없어 목차에 넣지 않는다.
 * 부르는 곳은 _wg-shell-nav.astro 하나지만 .astro 머리는 tsc 가 보지 않아 계산을 이 .ts 에 둔다
 */
export const toTocGroups = (outline: DocOutline): TocGroup[] => {
	const entries = outline.headings
		.filter((heading) => heading.depth === section_heading_depth.section || heading.depth === section_heading_depth.sub)
		.map((heading, index) => ({heading, section: outline.sections[index]}));
	const sections = entries.flatMap((entry, index): TocSection[] =>
		entry.heading.depth === section_heading_depth.section
			? [
					{
						heading: entry.heading,
						number: entry.section.number,
						part: entry.section.part,
						subs: takeWhile(entries.slice(index + 1), (sub) => sub.heading.depth !== section_heading_depth.section).map(
							(sub) => ({heading: sub.heading, number: sub.section.number}),
						),
					},
				]
			: [],
	);

	return sections.flatMap((section, index) =>
		index === 0 || section.part !== undefined
			? [
					{
						part: section.part,
						sections: [section, ...takeWhile(sections.slice(index + 1), (next) => next.part === undefined)],
					},
				]
			: [],
	);
};

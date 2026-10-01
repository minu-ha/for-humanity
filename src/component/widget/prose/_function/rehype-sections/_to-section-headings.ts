import type {Element, Root} from "hast";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";

/**
 * 번호 대상 h2·h3 · 중첩 블록까지 문서 순서 수집
 * rehype-heading-ids의 순회 순서와 일치
 */
export const toSectionHeadings = (node: Root | Element): Element[] => {
	return node.children.flatMap((child) => {
		if (child.type !== "element") {
			return [];
		}

		if (child.tagName === `h${section_heading_depth.section}` || child.tagName === `h${section_heading_depth.sub}`) {
			return [child];
		}

		return toSectionHeadings(child);
	});
};

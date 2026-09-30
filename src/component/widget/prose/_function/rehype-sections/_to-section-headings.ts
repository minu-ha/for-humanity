import type {Element, Root} from "hast";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";

/**
 * 번호를 받는 제목 (h2 · h3) 을 문서 순서대로 모은다.
 * Astro 는 인용 같은 블록 안의 제목도 목차에 모으므로 여기서도 블록 안까지 내려가 같은 차례를 만든다
 */
export const toSectionHeadings = (node: Root | Element): Element[] =>
	node.children.flatMap((child) => {
		if (child.type !== "element") {
			return [];
		}

		if (child.tagName === `h${section_heading_depth.section}` || child.tagName === `h${section_heading_depth.sub}`) {
			return [child];
		}

		return toSectionHeadings(child);
	});

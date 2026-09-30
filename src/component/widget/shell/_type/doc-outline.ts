import type {MarkdownHeading} from "astro";
import type {DocSection} from "@/component/widget/prose/_type/doc-section";

/**
 * 문서 한 장의 목차 재료. 문서 쪽이 Markdown 을 그린 결과에서 꺼내 넘긴다
 */
export interface DocOutline {
	/**
	 * Astro 가 문서 순서대로 모은 제목
	 */
	headings: MarkdownHeading[];
	/**
	 * rehype-sections 가 적은 번호와 가름. headings 가운데 h2 · h3 과 차례가 같다
	 */
	sections: DocSection[];
}

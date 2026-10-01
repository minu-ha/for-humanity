import type {DocSection} from "@/component/widget/prose/_type/doc-section";
import type {DocData} from "@/type/doc-data";
import type {DocHeading} from "@/type/doc-heading";

/**
 * 문서 처리 중간 계약 · read-docs의 머리말과 rehype의 제목·절 정보
 */
export interface DocFileData {
	/**
	 * 검증된 머리말
	 */
	frontmatter: DocData;
	/**
	 * 번호 삽입 전 제목 · 문서 순서
	 */
	headings: DocHeading[];
	/**
	 * 제목별 번호와 가름 · headings의 h2·h3 순서와 일치
	 */
	sections: DocSection[];
}

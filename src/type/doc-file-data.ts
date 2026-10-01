import type {DocSection} from "@/component/widget/prose/_type/doc-section";
import type {DocData} from "@/type/doc-data";
import type {DocHeading} from "@/type/doc-heading";

/**
 * 문서 하나를 그리는 동안 플러그인 사이에 나르는 값. read-docs 가 머리말을 넣고, rehype 플러그인이 제목과 번호를 채운다
 */
export interface DocFileData {
	/**
	 * 검사를 마친 머리말
	 */
	frontmatter: DocData;
	/**
	 * rehype-heading-ids 가 모은 제목. 문서 순서다
	 */
	headings: DocHeading[];
	/**
	 * rehype-sections 가 적은 번호와 가름. headings 가운데 h2 · h3 과 차례가 같다
	 */
	sections: DocSection[];
}

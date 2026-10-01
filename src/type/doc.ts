import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import type {DocData} from "@/type/doc-data";

/**
 * 그린 문서 한 장. read-docs 가 문서 폴더의 Markdown 마다 하나씩 만든다
 */
export interface Doc {
	/**
	 * 주소의 조각. 폴더를 뺀 파일 이름을 소문자로 (commands.md → commands)
	 */
	id: string;
	/**
	 * 검사를 마친 머리말
	 */
	data: DocData;
	/**
	 * 본문 HTML. 머리 (눈썹 · 제목 · 첫 글) 까지 들어 있다
	 */
	html: string;
	/**
	 * 사이드바 목차의 재료
	 */
	outline: DocOutline;
}

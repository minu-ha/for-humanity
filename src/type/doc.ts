import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import type {DocData} from "@/type/doc-data";

/**
 * Markdown 파일 하나의 렌더링 결과
 */
export interface Doc {
	/**
	 * 문서 URL id · 확장자 제외 소문자 경로 · 하위 폴더 포함
	 */
	id: string;
	/**
	 * 검증된 머리말
	 */
	data: DocData;
	/**
	 * 문서 머리와 본문을 포함한 HTML
	 */
	html: string;
	/**
	 * 사이드바 목차 입력
	 */
	outline: DocOutline;
}

import type {DocHeading} from "@/type/doc-heading";
import type {DocSection} from "@/type/doc-section";

/**
 * 문서 렌더링 결과의 목차 입력
 */
export interface DocOutline {
    /**
     * 작성한 제목의 id와 텍스트 · 문서 순서
     */
    headings: DocHeading[];
    /**
     * 제목별 가름 · headings의 h2·h3 순서와 일치
     */
    sections: DocSection[];
}

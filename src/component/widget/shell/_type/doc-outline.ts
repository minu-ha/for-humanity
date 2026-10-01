import type {DocSection} from "@/component/widget/prose/_type/doc-section";
import type {DocHeading} from "@/type/doc-heading";

/**
 * 문서 렌더링 결과의 목차 입력
 */
export interface DocOutline {
    /**
     * 번호 삽입 전 제목 · 문서 순서
     */
    headings: DocHeading[];
    /**
     * 제목별 번호와 가름 · headings의 h2·h3 순서와 일치
     */
    sections: DocSection[];
}

import type {DocData} from "@/type/doc-data";
import type {DocHeading} from "@/type/doc-heading";
import type {DocSection} from "@/type/doc-section";

/**
 * 문서 처리 중간 계약 · read-docs의 머리말과 rehype의 제목·절 정보
 */
export interface DocFileData {
    /**
     * 일반 문서의 검증된 머리말 · README 홈은 생략
     */
    frontmatter?: DocData;
    /**
     * 작성한 제목 · 문서 순서
     */
    headings: DocHeading[];
    /**
     * 제목별 가름 · headings의 h2·h3 순서와 일치
     */
    sections: DocSection[];
}

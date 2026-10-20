import type {DocData} from "@/type/doc-data";
import type {DocOutline} from "@/type/doc-outline";

/**
 * 문서 처리 중간 계약. read-docs의 머리말과 rehype의 제목, 절 정보
 */
export interface DocFileData extends DocOutline {
    /**
     * 일반 문서의 검증된 머리말. README 홈은 생략
     */
    frontmatter?: DocData;
}

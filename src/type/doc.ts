import type {DocContent} from "@/type/doc-content";
import type {DocData} from "@/type/doc-data";

/**
 * Markdown 파일 하나의 렌더링 결과
 */
export interface Doc extends DocContent {
    /**
     * 문서 URL id · 확장자 제외 소문자 경로 · 하위 폴더 포함
     */
    id: string;
    /**
     * 검증된 머리말
     */
    data: DocData;
    /**
     * 검증된 부모 문서 경로 · 최상위부터 직접 부모까지, 자신은 제외
     */
    ancestors: string[];
}

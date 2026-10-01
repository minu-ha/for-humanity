import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";

/**
 * README 홈과 일반 문서가 공유하는 렌더링 결과
 */
export interface DocContent {
    /**
     * 문서 머리와 본문을 포함한 HTML
     */
    html: string;
    /**
     * 사이드바 목차 입력
     */
    outline: DocOutline;
}

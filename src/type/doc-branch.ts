import type {Doc} from "@/type/doc";

/**
 * 문서 탐색의 클릭 가능한 가지 · 원래 URL과 본문을 유지
 */
export interface DocBranch extends Doc {
    /**
     * 같은 부모 아래의 문서 · order·제목·id 순, 말단 문서는 생략
     */
    children?: DocBranch[];
}

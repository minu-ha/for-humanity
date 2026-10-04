import type {Doc} from "@/type/doc";

/**
 * 사이드바의 문서 묶음 · 같은 이름도 전체 경로로 구분
 */
export interface DocGroup {
    /**
     * 현재 단계의 표시 이름
     */
    name: string;
    /**
     * 최상위부터 현재 단계까지의 경로
     */
    path: Doc["data"]["group"];
    /**
     * 현재 묶음에 직접 속한 문서 · order·제목·id 순
     */
    docs: Doc[];
    /**
     * 현재 묶음의 하위 묶음 · navigation·이름 순
     */
    groups: DocGroup[];
}

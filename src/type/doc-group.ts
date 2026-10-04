import type {Doc} from "@/type/doc";
import type {DocBranch} from "@/type/doc-branch";

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
     * 현재 묶음의 부모 없는 문서 · 하위 문서는 각 문서 가지에 포함
     */
    docs: DocBranch[];
    /**
     * 현재 묶음의 하위 묶음 · navigation·이름 순
     */
    groups: DocGroup[];
}

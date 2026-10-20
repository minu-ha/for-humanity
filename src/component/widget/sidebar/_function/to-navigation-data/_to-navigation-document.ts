import type {DocBranch} from "@/component/widget/sidebar/_type/doc-branch";
import type {NavigationDoc} from "@/component/widget/sidebar/_type/navigation-data";

/**
 * 본문을 제외할 문서 가지 입력
 */
interface NavigationDocumentParams {
    /**
     * 하위 문서가 있는 원본 문서
     */
    doc: DocBranch;

    /**
     * 현재 문서 식별자, 홈이면 생략
     */
    current?: string;
}

/**
 * 본문 없는 문서 가지. 재귀에서도 현재 페이지 한 항목만 표시
 */
export const toNavigationDocument = (params: NavigationDocumentParams): NavigationDoc => {
    return {
        id: params.doc.id,
        name: params.doc.data.name,
        label: params.doc.data.label,
        active: params.doc.id === params.current,
        children: params.doc.children === undefined ? [] : params.doc.children.map((doc) => toNavigationDocument({...params, doc})),
    };
};

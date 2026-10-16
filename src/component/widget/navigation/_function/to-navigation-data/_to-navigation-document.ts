import type {DocBranch} from "@/component/widget/navigation/_type/doc-branch";
import type {NavigationDoc} from "@/component/widget/navigation/_type/navigation-data";

/**
 * 본문을 제외할 문서 가지 입력
 */
interface NavigationDocumentOptions {
    /**
     * 하위 문서를 가진 원본 문서
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
export const toNavigationDocument = (options: NavigationDocumentOptions): NavigationDoc => {
    return {
        id: options.doc.id,
        name: options.doc.data.name,
        label: options.doc.data.label,
        active: options.doc.id === options.current,
        children: options.doc.children === undefined ? [] : options.doc.children.map((doc) => toNavigationDocument({...options, doc})),
    };
};

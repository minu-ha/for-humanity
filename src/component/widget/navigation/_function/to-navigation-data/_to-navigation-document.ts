import type {DocBranch} from "@/component/widget/navigation/_type/doc-branch";
import type {NavigationDoc} from "@/component/widget/navigation/_type/navigation-data";

/**
 * 본문 없는 문서 가지 · 재귀에서도 현재 페이지 한 항목만 표시
 */
export const toNavigationDocument = (options: {doc: DocBranch; current?: string}): NavigationDoc => ({
    id: options.doc.id,
    name: options.doc.data.name,
    label: options.doc.data.label,
    active: options.doc.id === options.current,
    children: options.doc.children === undefined ? [] : options.doc.children.map((doc) => toNavigationDocument({...options, doc})),
});

import type {NavigationDoc} from "@/component/widget/navigation/_type/navigation-data";
import type {DocBranch} from "@/type/doc-branch";

/**
 * 本문 없는 문서 가지 · 재귀에서도 현재 페이지와 조상 경로만 유지
 */
export const toNavigationDocument = (options: {doc: DocBranch; current?: string; ancestors: Set<string>}): NavigationDoc => ({
    id: options.doc.id,
    name: options.doc.data.name,
    label: options.doc.data.label,
    active: options.doc.id === options.current,
    current: options.doc.id === options.current || options.ancestors.has(options.doc.id),
    children: options.doc.children === undefined ? [] : options.doc.children.map((doc) => toNavigationDocument({...options, doc})),
});

import {locale_doc_name} from "@/constant/locale";
import type {Doc} from "@/type/doc";
import type {DocBranch} from "@/type/doc-branch";

/**
 * 검증된 부모 관계로 문서 가지를 재귀 구성 · 형제 순서와 URL 유지
 */
export const toDocBranches = (options: {docs: readonly Doc[]; children: ReadonlyMap<Doc["data"]["parent"], Doc[]>}): DocBranch[] => {
    return options.docs
        .toSorted((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, locale_doc_name) || a.id.localeCompare(b.id, locale_doc_name))
        .map((doc) => {
            const children = options.children.get(doc.id);
            return {...doc, children: children === undefined ? undefined : toDocBranches({docs: children, children: options.children})};
        });
};

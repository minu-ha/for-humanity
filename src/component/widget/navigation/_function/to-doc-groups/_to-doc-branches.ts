import {locale_doc_name} from "@/component/widget/navigation/_constant/locale";
import type {DocBranch} from "@/component/widget/navigation/_type/doc-branch";
import type {Doc} from "@/type/doc";

/**
 * 문서 가지의 재귀 구성 입력
 */
interface DocBranchesOptions {
    /**
     * 현재 깊이의 형제 문서
     */
    docs: readonly Doc[];

    /**
     * 검증된 부모 식별자별 하위 문서
     */
    children: ReadonlyMap<Doc["data"]["parent"], Doc[]>;
}

/**
 * 검증된 부모 관계로 문서 가지를 재귀 구성. 형제 순서와 URL 유지
 */
export const toDocBranches = (options: DocBranchesOptions): DocBranch[] => {
    return options.docs
        .toSorted((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, locale_doc_name) || a.id.localeCompare(b.id, locale_doc_name))
        .map((doc) => {
            const children = options.children.get(doc.id);
            return {...doc, children: children === undefined ? undefined : toDocBranches({docs: children, children: options.children})};
        });
};

import {locale_doc_name} from "@/component/widget/sidebar/_constant/locale";
import {navigation_children_absent} from "@/component/widget/sidebar/_constant/navigation";
import type {NavigationDoc} from "@/component/widget/sidebar/_type/navigation-data";
import type {Doc} from "@/type/doc";

/**
 * 문서 가지의 재귀 구성 입력
 */
interface NavigationDocsParams {
    /**
     * 현재 깊이의 형제 문서
     */
    docs: readonly Doc[];

    /**
     * 검증된 부모 식별자별 하위 문서
     */
    children: ReadonlyMap<Doc["data"]["parent"], Doc[]>;

    /**
     * 현재 문서 식별자, 홈이면 생략
     */
    current?: string;
}

/**
 * 검증된 부모 관계의 본문 없는 문서 가지
 *
 *   - 형제는 order, 이름, id 순
 *   - 재귀에서도 현재 페이지 한 항목만 강조
 */
export const toNavigationDocs = (params: NavigationDocsParams): NavigationDoc[] => {
    return params.docs
        .toSorted((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, locale_doc_name) || a.id.localeCompare(b.id, locale_doc_name))
        .map((doc) => {
            return {
                id: doc.id,
                name: doc.data.name,
                label: doc.data.label,
                active: doc.id === params.current,
                children: toNavigationDocs({...params, docs: params.children.get(doc.id) ?? navigation_children_absent}),
            };
        });
};

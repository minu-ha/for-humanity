import {locale_doc_group, locale_doc_name} from "@/constant/locale";
import type {Doc} from "@/type/doc";
import type {SiteConfig} from "@/type/site-config";

/**
 * 사이드바의 읽는 순서 · 설정 밖 묶음은 뒤에서 이름순
 * 같은 문서 이름·순서도 파일 id로 구분해 탐색 순서를 고정
 */
export const toDocGroups = (options: {docs: readonly Doc[]; navigation: SiteConfig["navigation"]}) => {
    const positions = new Map(options.navigation.map((name, index) => [name, index]));

    return [...Map.groupBy(options.docs, (doc) => doc.data.group)]
        .toSorted((a, b) => (positions.get(a[0]) ?? options.navigation.length) - (positions.get(b[0]) ?? options.navigation.length) || a[0].localeCompare(b[0], locale_doc_group))
        .map(([name, docs]) => ({
            name,
            docs: docs.toSorted((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, locale_doc_name) || a.id.localeCompare(b.id, locale_doc_name)),
        }));
};

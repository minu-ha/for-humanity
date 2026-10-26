import {toNavigationData} from "@/component/widget/sidebar/_function/to-navigation-data/to-navigation-data";
import {WgSidebar} from "@/component/widget/sidebar/wg-sidebar";

/**
 * 서버 탐색 마크업의 문서 목록만 추출, 사이트 이름 링크와 목차 제외. 언어판 없는 기본 언어 탐색
 */
export const toNavigationHtml = (params: Omit<Parameters<typeof toNavigationData>[0], "alternates">) => {
    const navigation = WgSidebar({data: toNavigationData({...params, alternates: []})})
        .toString()
        .match(/<nav[^>]*class="wg_docTree__root"[\s\S]*?<\/nav>/)?.[0];

    if (navigation === undefined) {
        throw new Error("문서 탐색 영역이 없습니다");
    }

    return navigation;
};

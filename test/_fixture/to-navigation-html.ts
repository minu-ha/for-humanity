import {toNavigationData} from "@/component/widget/sidebar/_function/to-navigation-data/to-navigation-data";
import {WgSidebar} from "@/component/widget/sidebar/wg-sidebar";

/**
 * 서버 탐색 마크업의 문서 목록만 추출, 사이트 이름 링크와 목차 제외
 */
export const toNavigationHtml = (params: Parameters<typeof toNavigationData>[0]) => {
    const navigation = WgSidebar({data: toNavigationData(params)})
        .toString()
        .match(/<nav[^>]*class="wg_docTree__root"[\s\S]*?<\/nav>/)?.[0];

    if (navigation === undefined) {
        throw new Error("문서 탐색 영역이 없습니다");
    }

    return navigation;
};

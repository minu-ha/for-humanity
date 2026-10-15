import {toNavigationData} from "@/component/widget/navigation/_function/to-navigation-data/to-navigation-data";
import {WgNavigation} from "@/component/widget/navigation/wg-navigation";

/**
 * 서버 탐색 마크업 중 문서 목록, 목차와 중복되는 링크 제외
 */
export const toNavigationHtml = (options: Parameters<typeof toNavigationData>[0]) => {
    const markup = WgNavigation({data: toNavigationData(options)}).toString();
    const navigation = markup.match(/<nav[^>]*class="wg_navigationNav__root"[\s\S]*?<\/nav>/)?.[0];
    if (navigation === undefined) throw new Error("문서 탐색 영역이 없습니다");
    return navigation;
};

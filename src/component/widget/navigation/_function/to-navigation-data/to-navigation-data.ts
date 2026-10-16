import {toDocGroups} from "@/component/widget/navigation/_function/to-doc-groups/to-doc-groups";
import {toNavigationGroup} from "@/component/widget/navigation/_function/to-navigation-data/_to-navigation-group";
import {toTocGroups} from "@/component/widget/navigation/_function/to-toc-groups";
import type {NavigationData} from "@/component/widget/navigation/_type/navigation-data";
import type {Doc} from "@/type/doc";
import type {DocOutline} from "@/type/doc-outline";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 브라우저 탐색에 전달할 문서 자료
 */
interface NavigationDataOptions {
    /**
     * 기본값을 적용한 사이트 설정
     */
    site: ResolvedSiteConfig;

    /**
     * 검증한 전체 문서
     */
    docs: Doc[];

    /**
     * 현재 문서 식별자, 홈이면 생략
     */
    current?: string;

    /**
     * 현재 본문의 제목 계층
     */
    outline?: DocOutline;
}

/**
 * 현재 문서의 이름, 계층, 목차만 전송. 다른 문서 본문은 브라우저 탐색 입력에서 제외
 */
export const toNavigationData = (options: NavigationDataOptions): NavigationData => {
    return {
        title: options.site.title,
        groups: toDocGroups({docs: options.docs, navigation: options.site.navigation}).map((group) => toNavigationGroup({group, current: options.current})),
        outline: options.outline === undefined ? [] : toTocGroups(options.outline),
        home: options.current === undefined,
        cursorFace: options.site.cursorFace,
    };
};

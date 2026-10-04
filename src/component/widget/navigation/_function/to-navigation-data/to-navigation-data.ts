import {toDocGroups} from "@/component/widget/navigation/_function/to-doc-groups/to-doc-groups";
import {toNavigationGroup} from "@/component/widget/navigation/_function/to-navigation-data/_to-navigation-group";
import {toTocGroups} from "@/component/widget/navigation/_function/to-toc-groups";
import type {NavigationData} from "@/component/widget/navigation/_type/navigation-data";
import type {Doc} from "@/type/doc";
import type {DocOutline} from "@/type/doc-outline";
import type {SiteConfig} from "@/type/site-config";

/**
 * 현재 문서의 이름·계층·목차만 전송 · 다른 문서 본문은 브라우저 탐색 입력에서 제외
 */
export const toNavigationData = (options: {site: SiteConfig; docs: Doc[]; current?: string; outline?: DocOutline}): NavigationData => {
    const currentDoc = options.docs.find((doc) => doc.id === options.current);
    const ancestors = new Set(currentDoc?.ancestors);

    return {
        title: options.site.title,
        groups: toDocGroups({docs: options.docs, navigation: options.site.navigation}).map((group) =>
            toNavigationGroup({group, current: options.current, ancestors, currentGroup: currentDoc?.data.group}),
        ),
        outline: options.outline === undefined ? [] : toTocGroups(options.outline),
        pageId: options.current === undefined ? "/" : options.current,
        home: options.current === undefined,
    };
};

import {takeWhile, zip} from "es-toolkit/array";
import {section_heading_depth} from "@/component/widget/article/_constant/section";
import {toDocGroups} from "@/component/widget/sidebar/_function/to-navigation-data/_to-doc-groups";
import {toNavigationGroup} from "@/component/widget/sidebar/_function/to-navigation-data/_to-navigation-group";
import type {NavigationData} from "@/component/widget/sidebar/_type/navigation-data";
import type {TocSection} from "@/component/widget/sidebar/_type/toc-group";
import type {Doc} from "@/type/doc";
import type {DocOutline} from "@/type/doc-outline";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 브라우저 탐색에 전달할 문서 자료
 */
interface NavigationDataParams {
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
 *
 *   - 목차는 h2별 h3 수집, 가름 시작 절에서 목차 묶음 분리
 *   - 첫 h2 앞의 h3은 목차 제외
 */
export const toNavigationData = (params: NavigationDataParams): NavigationData => {
    // 1. 목차 대상 제목과 같은 순서의 절 정보. 본문 제목 계층이 없으면 빈 목차
    const entries =
        params.outline === undefined
            ? []
            : zip(
                  params.outline.headings.filter((heading) => heading.depth === section_heading_depth.section || heading.depth === section_heading_depth.sub),
                  params.outline.sections,
              );

    // 2. h2마다 다음 h2 전까지의 h3 수집
    const sections = entries.flatMap(([heading, section], index): TocSection[] => {
        if (heading.depth !== section_heading_depth.section) {
            return [];
        }

        return [
            {
                heading,
                part: section.part,
                subs: takeWhile(entries.slice(index + 1), ([sub]) => sub.depth !== section_heading_depth.section).map(([sub]) => {
                    return {heading: sub};
                }),
            },
        ];
    });

    return {
        title: params.site.title,
        groups: toDocGroups({docs: params.docs, navigation: params.site.navigation}).map((group) => toNavigationGroup({group, current: params.current})),

        // 3. 가름 시작 절부터 다음 가름 전까지 한 목차 묶음
        outline: sections.flatMap((section, index) => {
            if (index > 0 && section.part === undefined) {
                return [];
            }

            return [
                {
                    part: section.part,
                    sections: [section, ...takeWhile(sections.slice(index + 1), (next) => next.part === undefined)],
                },
            ];
        }),
        home: params.current === undefined,
        cursorFace: params.site.cursorFace,
    };
};

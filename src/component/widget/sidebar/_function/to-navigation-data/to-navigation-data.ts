import {createHash} from "node:crypto";
import {takeWhile, uniqBy, zip} from "es-toolkit/array";
import {section_heading_depth} from "@/component/widget/article/_constant/section";
import {navigation_signature_length} from "@/component/widget/sidebar/_constant/navigation";
import {toNavigationGroups} from "@/component/widget/sidebar/_function/to-navigation-data/_to-navigation-groups";
import type {NavigationData} from "@/component/widget/sidebar/_type/navigation-data";
import type {TocSection} from "@/component/widget/sidebar/_type/toc-group";
import type {Doc} from "@/type/doc";
import type {DocOutline} from "@/type/doc-outline";
import type {ResolvedSiteConfig} from "@/type/site-config";
import type {PageAlternate} from "@/util/locale/to-alternates";
import {toPagePath} from "@/util/url/to-page-path";

/**
 * 브라우저 탐색에 전달할 문서 자료
 */
interface NavigationDataParams {
    /**
     * 기본값을 적용한 사이트 설정
     */
    site: ResolvedSiteConfig;

    /**
     * 검증한 전체 문서. 현재 언어의 문서만 탐색에 포함
     */
    docs: Doc[];

    /**
     * 현재 문서 식별자, 홈이면 생략
     */
    current?: string;

    /**
     * 현재 페이지의 언어 코드, 기본 언어면 생략
     */
    locale?: Doc["locale"];

    /**
     * 셸이 계산한 현재 페이지의 언어판
     */
    alternates: PageAlternate[];

    /**
     * 현재 본문의 제목 계층
     */
    outline?: DocOutline;
}

/**
 * 현재 문서의 이름, 계층, 목차만 전송. 다른 문서 본문은 브라우저 탐색 입력에서 제외
 *
 *   - 설정 경로 순서의 묶음 배치, 미지정 형제 묶음은 뒤에서 이름순
 *   - 목록 식별값은 페이지별 활성 표시 제외, 같은 목록에서만 저장 위치 복원
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

    // 3. 현재 언어 문서의 메타데이터 경로 계층. 설정 경로와 조상 경로마다 최초 지정 위치 사용
    const docs = params.docs.filter((doc) => doc.locale === params.locale);
    const groups = toNavigationGroups({
        docs,
        children: Map.groupBy(docs, (doc) => doc.data.parent),
        path: [],
        positions: new Map(
            uniqBy(
                params.site.navigation.flatMap((path, index) => {
                    return path.map((_name, depth) => [JSON.stringify(path.slice(0, depth + 1)), index] as const);
                }),
                (entry) => entry[0],
            ),
        ),
        unlistedPosition: params.site.navigation.length,
        current: params.current,
    });

    return {
        basePath: params.site.basePath,
        title: params.site.title,
        homePath: toPagePath(params.locale),

        // 언어 이름은 그 언어의 자기 표기. Intl이 모르는 태그는 코드 그대로
        languages:
            params.site.locales.length === 0
                ? []
                : params.alternates.map((alternate) => {
                      return {
                          name: new Intl.DisplayNames([alternate.lang], {type: "language"}).of(alternate.lang) ?? alternate.lang,
                          lang: alternate.lang,
                          path: alternate.path,
                          active: alternate.code === params.locale,
                      };
                  }),
        groups,
        signature: createHash("sha256")
            .update(params.site.basePath)
            .update(JSON.stringify(groups, (key, value: unknown) => (key === "active" ? undefined : value)))
            .digest("base64url")
            .slice(0, navigation_signature_length),

        // 4. 가름 시작 절부터 다음 가름 전까지 한 목차 묶음
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

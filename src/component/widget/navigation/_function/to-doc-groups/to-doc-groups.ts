import {toDocGroupBranches} from "@/component/widget/navigation/_function/to-doc-groups/_to-doc-group-branches";
import type {Doc} from "@/type/doc";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 문서 묶음의 계층과 순서 입력
 */
interface DocGroupsOptions {
    /**
     * 검증한 전체 문서
     */
    docs: readonly Doc[];
    /**
     * 기본값과 경로 정규화를 적용한 묶음 순서
     */
    navigation: ResolvedSiteConfig["navigation"];
}

/**
 * 메타데이터 경로로 읽는 순서를 가진 문서 계층 구성
 * navigation의 첫 지정을 조상에도 적용 · 미지정 형제 묶음은 이름순
 */
export const toDocGroups = (options: DocGroupsOptions) => {
    // 같은 조상을 지정한 경로는 최초 navigation 위치를 우선
    const positions = new Map(options.navigation.flatMap((path, index) => path.map((_name, depth) => [JSON.stringify(path.slice(0, depth + 1)), index] as const)).toReversed());

    const children = Map.groupBy(options.docs, (doc) => doc.data.parent);
    return toDocGroupBranches({docs: options.docs, children, path: [], positions, unlistedPosition: options.navigation.length});
};

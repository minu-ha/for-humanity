import {toDocGroupBranches} from "@/content/to-doc-groups/_to-doc-group-branches";
import type {Doc} from "@/type/doc";
import type {SiteConfig} from "@/type/site-config";

/**
 * 메타데이터 경로로 읽는 순서를 가진 문서 계층 구성
 * navigation의 첫 지정을 조상에도 적용 · 미지정 형제 묶음은 이름순
 */
export const toDocGroups = (options: {docs: readonly Doc[]; navigation: SiteConfig["navigation"]}) => {
    // 같은 조상을 지정한 경로는 최초 navigation 위치를 우선
    const positions = new Map(options.navigation.flatMap((path, index) => path.map((_name, depth) => [JSON.stringify(path.slice(0, depth + 1)), index] as const)).toReversed());

    return toDocGroupBranches({docs: options.docs, path: [], positions, unlistedPosition: options.navigation.length});
};

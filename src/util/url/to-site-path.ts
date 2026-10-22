import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 사이트 안의 URL과 배포 경로
 */
interface SitePathParams {
    /**
     * 끝 슬래시를 포함한 검증된 배포 경로
     */
    basePath: ResolvedSiteConfig["basePath"];

    /**
     * 사이트 루트 기준 URL, 외부 주소와 해시는 원문 유지
     */
    path: string;
}

/**
 * 사이트 루트 URL의 배포 경로 적용, 쿼리와 해시 보존
 */
export const toSitePath = (params: SitePathParams) => {
    return params.path.startsWith("/") && !params.path.startsWith("//") ? `${params.basePath}${params.path.slice(1)}` : params.path;
};

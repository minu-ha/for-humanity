import {z} from "zod";
import {copy_error_navigation_clash, copy_error_site_url, copy_site_title_default} from "@/constant/copy";
import {site_navigation_default, site_port_default, site_port_max, site_port_min} from "@/constant/site";
import {status_default_phrases, status_kind} from "@/constant/status";
import {groupPathSchema} from "@/type/group-path";

/**
 * 사이트 설정의 입력 검증과 기본값 적용
 */
export const siteConfigSchema = z.object({
    /**
     * 사이드바 이름과 탭 제목
     */
    title: z.string().default(copy_site_title_default),
    /**
     * HTML 설명 메타데이터 · 선택
     */
    description: z.string().optional(),
    /**
     * 공개 사이트 루트 URL · 지정할 때만 robots.txt와 sitemap.xml 생성
     */
    url: z
        .url({protocol: /^https?$/})
        .transform((value) => new URL(value))
        .refine((value) => value.username === "" && value.password === "" && value.pathname === "/" && value.search === "" && value.hash === "", copy_error_site_url)
        .transform((value) => value.origin)
        .optional(),
    /**
     * dev·preview 서버 포트 · 같은 기계에서 문서 프로젝트 둘을 나란히 띄울 때 한쪽에 지정
     */
    port: z.int().min(site_port_min).max(site_port_max).default(site_port_default),
    /**
     * 데스크톱 커서 옆 픽셀 얼굴 · 기본 꺼짐 · favicon 은 설정과 무관
     */
    cursorFace: z.boolean().default(false),
    /**
     * 탐색 묶음 경로의 읽는 순서 · 미지정 형제 묶음은 뒤에서 이름순
     */
    navigation: z
        .array(groupPathSchema)
        .refine((groups) => new Set(groups.map((path) => JSON.stringify(path))).size === groups.length, copy_error_navigation_clash)
        .default(site_navigation_default.map((name) => [name])),
    /**
     * 본문에서 상태 표지로 표시할 문구
     */
    status: z
        .array(
            z.object({
                /**
                 * 찾을 문구 원문
                 */
                phrase: z
                    .string()
                    .min(1)
                    .refine((phrase) => phrase.trim().length > 0),
                /**
                 * 상태 표지의 색 종류
                 */
                kind: z.enum(status_kind),
                /**
                 * 문구 뒤의 YYYY-MM-DD 날짜 포함 여부
                 */
                date: z.boolean().optional(),
            }),
        )
        .default(status_default_phrases),
});

/**
 * 기본값을 적용한 사이트 설정
 */
export type ResolvedSiteConfig = z.infer<typeof siteConfigSchema>;

/**
 * 작성자가 지정하는 사이트 설정, 기본값 적용 전 입력
 */
export interface SiteConfig {
    /**
     * 사이드바 이름과 탭 제목, 생략 시 for humanity
     */
    title?: z.input<typeof siteConfigSchema>["title"];
    /**
     * 검색 결과에 표시할 사이트 설명
     */
    description?: z.input<typeof siteConfigSchema>["description"];
    /**
     * 공개 HTTP(S) 루트 주소, 지정 시 robots.txt와 sitemap.xml 생성
     */
    url?: z.input<typeof siteConfigSchema>["url"];
    /**
     * dev와 preview 포트, 1부터 65535까지 정수, 기본값 4321
     */
    port?: z.input<typeof siteConfigSchema>["port"];
    /**
     * 데스크톱 커서 얼굴 표시, 기본값 false
     */
    cursorFace?: z.input<typeof siteConfigSchema>["cursorFace"];
    /**
     * 탐색 묶음의 표시 순서, 문자열 또는 중첩 이름 경로
     */
    navigation?: z.input<typeof siteConfigSchema>["navigation"];
    /**
     * 상태 표지 목록, 빈 배열 지정 시 상태 표지 미표시
     */
    status?: z.input<typeof siteConfigSchema>["status"];
}

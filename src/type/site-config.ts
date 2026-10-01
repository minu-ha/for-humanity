import {z} from "zod";
import {copy_error_navigation_clash, copy_site_title_default} from "@/constant/copy";
import {site_navigation_default, site_repository_provider} from "@/constant/site";
import {status_default_phrases, status_kind} from "@/constant/status";

/**
 * for-humanity.config.mjs 설정 스키마
 * 명령 시작 시 검증과 기본값 적용 · 앱은 검증 결과만 사용
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
     * 사이드바 하단의 저장소 링크 · 생략하면 아이콘 숨김
     */
    repository: z
        .object({
            /**
             * 표시할 서비스 아이콘
             */
            provider: z.enum(site_repository_provider),
            /**
             * 웹으로 방문할 저장소 또는 프로필 URL
             */
            url: z.url({protocol: /^https?$/}),
        })
        .optional(),
    /**
     * 탐색 묶음의 읽는 순서 · 미지정 묶음은 뒤에서 이름순
     */
    navigation: z
        .array(z.string().trim().min(1))
        .refine((groups) => new Set(groups).size === groups.length, copy_error_navigation_clash)
        .default([...site_navigation_default]),
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
export type SiteConfig = z.infer<typeof siteConfigSchema>;

import {z} from "zod";
import {copy_site_title_default} from "@/constant/copy";
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
	 * 첫 화면 소개 · 선택
	 */
	description: z.string().optional(),
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

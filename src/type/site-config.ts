import {z} from "zod";
import {copy_site_title_default} from "@/constant/copy";
import {status_default_phrases, status_kind} from "@/constant/status";

/**
 * 문서 폴더의 for-humanity.config.mjs 가 내보내는 설정.
 * 명령이 파일을 읽을 때 한 번 검사하고 빠진 값을 채운다. 앱은 채운 값만 읽는다
 */
export const siteConfigSchema = z.object({
	/**
	 * 사이드바 맨 위와 탭 제목의 사이트 이름
	 */
	title: z.string().default(copy_site_title_default),
	/**
	 * 첫 화면 제목 밑의 한두 줄
	 */
	description: z.string().optional(),
	/**
	 * 본문에서 알약으로 바꿀 문구
	 */
	status: z
		.array(
			z.object({
				/**
				 * 본문에서 찾을 글 그대로
				 */
				phrase: z.string(),
				/**
				 * 알약의 색
				 */
				kind: z.enum(status_kind),
				/**
				 * 뒤에 붙은 날짜 (2026-09-30) 까지 알약에 넣는가
				 */
				date: z.boolean().optional(),
			}),
		)
		.default(status_default_phrases),
});

/**
 * 기본값을 채운 사이트 설정
 */
export type SiteConfig = z.infer<typeof siteConfigSchema>;

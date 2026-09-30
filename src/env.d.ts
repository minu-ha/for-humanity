/// <reference types="astro/client" />
/// <reference types="mdast-util-to-hast" />

/**
 * 명령 (cli.ts) 이 앱에 넘기는 값. cli.ts 의 Vite 플러그인이 만든다
 */
declare module "virtual:for-humanity/config" {
	/**
	 * 기본값을 채운 사이트 설정
	 */
	export const siteConfig: import("@/type/site-config").SiteConfig;
	/**
	 * 문서 폴더의 절대 경로
	 */
	export const docsRoot: string;
}

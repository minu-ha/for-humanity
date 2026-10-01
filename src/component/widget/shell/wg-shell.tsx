import clsx from "clsx";
import type {ReactNode} from "react";
import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import {WgShellNav} from "@/component/widget/shell/_wg-shell-nav";
import {asset_client_path, asset_favicon_path, asset_reload_path, asset_style_path} from "@/constant/asset";
import {theme_mode, theme_storage_key} from "@/constant/theme";
import type {Doc} from "@/type/doc";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";
import "@/style/base.css";
import "@/style/token.css";
import "./wg-shell.css";

/**
 * 첫 페인트 전 테마 적용 · 저장소 접근 실패 시 시스템
 * 초기 smooth scroll 중지 · client.ts의 hash 보정 후 복원
 */
const themeScript = `(function(){document.documentElement.style.scrollBehavior="auto";try{var theme=localStorage.getItem(${JSON.stringify(theme_storage_key)});if(${JSON.stringify([theme_mode.light, theme_mode.dark])}.includes(theme)){document.documentElement.setAttribute("data-theme",theme)}}catch(e){}})()`;

/**
 * dev 문서 변경 시 SSE 새로고침
 */
const reloadScript = `new EventSource(${JSON.stringify(asset_reload_path)}).onmessage=function(){location.reload()}`;

/**
 * 공통 HTML 틀의 입력 · 사이드바와 본문
 */
export interface WgShellProps {
	/**
	 * 사이트 이름 · 탭과 사이드바
	 */
	site: SiteConfig;
	/**
	 * 사이드바 전체 문서 목록
	 */
	docs: Doc[];
	/**
	 * HTML 머리의 글꼴·dev 스크립트
	 */
	assets: SiteAssets;
	/**
	 * 탭 제목의 문서 이름 · 첫 화면 생략
	 */
	title?: string;
	/**
	 * 현재 문서 id · 첫 화면 생략
	 */
	current?: string;
	/**
	 * 현재 문서 목차 · 첫 화면 생략
	 */
	outline?: DocOutline;
	/**
	 * 현재 페이지 본문
	 */
	children: ReactNode;
}

export const WgShell = (props: WgShellProps) => {
	return (
		<html lang="ko">
			{/**
			 * 공통 자원과 첫 페인트 전 테마
			 */}
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{props.title === undefined ? props.site.title : `${props.title} · ${props.site.title}`}</title>
				<link rel="icon" href={asset_favicon_path} type="image/svg+xml" />
				<style dangerouslySetInnerHTML={{__html: props.assets.fontCss}} />
				{props.assets.preload.map((href) => (
					<link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
				))}
				<script dangerouslySetInnerHTML={{__html: themeScript}} />
				<link rel="stylesheet" href={asset_style_path} />
				{props.assets.reload && <script dangerouslySetInnerHTML={{__html: reloadScript}} />}
			</head>
			{/**
			 * 문서 이동과 본문 · 브라우저 동작 연결
			 */}
			<body className={clsx("wg_shell__root")}>
				<WgShellNav site={props.site} docs={props.docs} current={props.current} outline={props.outline} />
				<main className={clsx("wg_shell__main")}>{props.children}</main>
				<script type="module" src={asset_client_path} />
			</body>
		</html>
	);
};

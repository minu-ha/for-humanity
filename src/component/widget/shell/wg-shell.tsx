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
 * 쪽을 그리기 전에 머리에서 도는 스크립트. 쪽을 여는 동안 부드러운 스크롤을 끄고 (client.ts 가 자리를 맞춘 뒤 다시 켠다),
 * 기억한 테마를 data-theme 으로 붙인다. 저장소가 막혀 있으면 시스템 테마를 따른다
 */
const themeScript = `(function(){document.documentElement.style.scrollBehavior="auto";try{var theme=localStorage.getItem(${JSON.stringify(theme_storage_key)});if(${JSON.stringify([theme_mode.light, theme_mode.dark])}.includes(theme)){document.documentElement.setAttribute("data-theme",theme)}}catch(e){}})()`;

/**
 * dev 에서 문서가 바뀌면 쪽을 다시 연다
 */
const reloadScript = `new EventSource(${JSON.stringify(asset_reload_path)}).onmessage=function(){location.reload()}`;

/**
 * 모든 쪽의 틀. 왼쪽 칸이 사이드바, 오른쪽 칸이 본문이다. 테마는 그리기 전에 머리에서 정한다
 */
export interface WgShellProps {
	/**
	 * 탭 제목과 사이드바 맨 위 이름의 출처
	 */
	site: SiteConfig;
	/**
	 * 문서 모음 전부. 사이드바 문서 목록이 쓴다
	 */
	docs: Doc[];
	/**
	 * 머리에 넣는 글꼴과 dev 여부
	 */
	assets: SiteAssets;
	/**
	 * 탭 제목에서 사이트 이름 앞에 붙는 문서 이름. 첫 화면은 없다
	 */
	title?: string;
	/**
	 * 지금 연 문서의 id. 첫 화면은 없다
	 */
	current?: string;
	/**
	 * 사이드바 목차의 재료. 첫 화면은 없다
	 */
	outline?: DocOutline;
	children: ReactNode;
}

export const WgShell = (props: WgShellProps) => {
	return (
		<html lang="ko">
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
			<body className="wg_shell__root">
				<WgShellNav site={props.site} docs={props.docs} current={props.current} outline={props.outline} />
				<main className="wg_shell__main">{props.children}</main>
				<script type="module" src={asset_client_path} />
			</body>
		</html>
	);
};

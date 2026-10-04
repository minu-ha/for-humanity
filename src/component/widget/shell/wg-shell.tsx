import clsx from "clsx";
import type {Child} from "hono/jsx";
import {toNavigationData} from "@/component/widget/navigation/_function/to-navigation-data/to-navigation-data";
import {toNavigationJson} from "@/component/widget/navigation/_function/to-navigation-json";
import {WgShellControls} from "@/component/widget/shell-controls/wg-shell-controls";
import {asset_favicon_path} from "@/constant/asset";
import type {Doc} from "@/type/doc";
import type {DocOutline} from "@/type/doc-outline";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";
import "@/style/base.css";
import "@/style/token.css";
import "./wg-shell.css";

/**
 * 공통 HTML 틀의 입력 · 문서 탐색·현재 목차·본문
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
     * 현재 문서 또는 README 홈의 목차
     */
    outline?: DocOutline;
    /**
     * 현재 페이지 본문
     */
    children: Child;
}

export const WgShell = (props: WgShellProps) => {
    const navigationData = toNavigationData({site: props.site, docs: props.docs, current: props.current, outline: props.outline});

    return (
        <html lang="ko">
            {/**
             * 공통 자원 · 브라우저 동작은 WgShellControls의 생명주기에서 연결
             */}
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                {props.site.description !== undefined && <meta name="description" content={props.site.description} />}
                <title>{props.title === undefined ? props.site.title : `${props.title} · ${props.site.title}`}</title>
                <link rel="icon" href={asset_favicon_path} type="image/svg+xml" />
                <style dangerouslySetInnerHTML={{__html: props.assets.fontCss}} />
                {props.assets.preload.map((href) => (
                    <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="" />
                ))}
                <link rel="stylesheet" href={props.assets.stylePath} />
            </head>
            {/**
             * 문서 탐색·현재 목차·본문 · 브라우저 동작 연결
             */}
            <body className={clsx("wg_shell__root")}>
                {/**
                 * 서버·브라우저의 공통 셸 조립 · 본문 HTML은 마운트 범위에서 제외
                 */}
                <div className={clsx("wg_shell__browserRoot")} data-shell-browser-root="" data-shell-reload={props.assets.reload ? "" : undefined}>
                    <WgShellControls data={navigationData} reload={props.assets.reload} />
                </div>
                {/**
                 * 최소 탐색 자료와 단일 JSX 번들 · 본문 전 상태·스크롤 복원
                 */}
                <script type="application/json" id="fh-navigation-data" dangerouslySetInnerHTML={{__html: toNavigationJson(navigationData)}} />
                <script dangerouslySetInnerHTML={{__html: props.assets.browserScript}} />
                <main className={clsx("wg_shell__main")}>{props.children}</main>
            </body>
        </html>
    );
};

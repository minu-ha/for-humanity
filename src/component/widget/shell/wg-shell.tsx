import clsx from "clsx";
import type {ReactNode} from "react";
import {
    navigation_mobile_query,
    navigation_scroll_storage_key,
    navigation_storage_version,
    navigation_tree_storage_key,
    navigation_wide_query,
} from "@/component/widget/shell/_constant/navigation";
import {bindNavigationOverflow} from "@/component/widget/shell/_function/bind-navigation-overflow";
import {placeNavigationOutline} from "@/component/widget/shell/_function/place-navigation-outline";
import {restoreNavigationScroll} from "@/component/widget/shell/_function/restore-navigation-scroll";
import {restoreNavigationTree} from "@/component/widget/shell/_function/restore-navigation-tree";
import {toNavigationScrollState} from "@/component/widget/shell/_function/to-navigation-scroll-state";
import {toNavigationTreeState} from "@/component/widget/shell/_function/to-navigation-tree-state";
import {toTocGroups} from "@/component/widget/shell/_function/to-toc-groups";
import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import {WgShellNav} from "@/component/widget/shell/_wg-shell-nav";
import {WgShellToc} from "@/component/widget/shell/_wg-shell-toc";
import {asset_favicon_path, asset_reload_path} from "@/constant/asset";
import {copy_nav_close, copy_nav_open, copy_nav_title} from "@/constant/copy";
import type {Doc} from "@/type/doc";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";
import "@/style/base.css";
import "@/style/token.css";
import "./wg-shell.css";

/**
 * dev 문서 변경 시 SSE 새로고침
 */
const reloadScript = `new EventSource(${JSON.stringify(asset_reload_path)}).onmessage=function(){location.reload()}`;

/**
 * 탐색 DOM 직후 동기 실행 · 큰 본문과 module 다운로드를 기다리지 않고 첫 위치·흐림 적용
 * 손잡이 숨김으로 달라지는 목록 폭을 먼저 확정한 뒤 좌표 복원
 */
const navigationScript = `(${placeNavigationOutline.toString()})(${JSON.stringify(navigation_wide_query)});
(${restoreNavigationTree.toString()})({key:${JSON.stringify(navigation_tree_storage_key)},version:${navigation_storage_version},toState:(${toNavigationTreeState.toString()})});
(${bindNavigationOverflow.toString()})();
if(!matchMedia(${JSON.stringify(navigation_mobile_query)}).matches){(${restoreNavigationScroll.toString()})({key:${JSON.stringify(navigation_scroll_storage_key)},version:${navigation_storage_version},layout:matchMedia(${JSON.stringify(navigation_wide_query)}).matches?"wide":"desktop",toState:(${toNavigationScrollState.toString()})})}`;

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
    children: ReactNode;
}

export const WgShell = (props: WgShellProps) => {
    const tocGroups = props.outline === undefined ? [] : toTocGroups(props.outline);

    return (
        <html lang="ko">
            {/**
             * 공통 자원 · 초기 smooth scroll은 client.ts의 hash 위치 보정 후 복원
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
                <script dangerouslySetInnerHTML={{__html: 'document.documentElement.style.scrollBehavior="auto"'}} />
                <link rel="stylesheet" href={props.assets.stylePath} />
                {props.assets.reload && <script dangerouslySetInnerHTML={{__html: reloadScript}} />}
            </head>
            {/**
             * 문서 탐색·현재 목차·본문 · 브라우저 동작 연결
             */}
            <body className={clsx("wg_shell__root")}>
                {/**
                 * 데스크톱의 공유 사이드바 · 모바일에서는 브랜드와 메뉴 버튼
                 */}
                <div className={clsx("wg_shell__sidebar")}>
                    {/**
                     * 브랜드와 모바일 메뉴 진입 · 버튼은 동작 연결 후 표시
                     */}
                    <div className={clsx("wg_shell__brandRow")}>
                        {/**
                         * 어느 문서에서도 README 홈으로 이동
                         */}
                        <a className={clsx("wg_shell__brand")} href="/" aria-current={props.current === undefined ? "page" : undefined}>
                            {props.site.title}
                        </a>
                        {/**
                         * 접힌 모바일 탐색의 진입점과 열림 상태 전달
                         */}
                        <button
                            className={clsx("wg_shell__menuToggle")}
                            type="button"
                            aria-label={copy_nav_open}
                            aria-controls="fh-navigation-drawer"
                            aria-expanded="false"
                            data-navigation-open=""
                        >
                            <svg className={clsx("wg_shell__menuIcon")} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    {/**
                     * 같은 탐색 DOM을 모바일 대화상자로 이동 · 스크립트 없이도 기본 목록 제공
                     */}
                    <div className={clsx("wg_shell__navigation")} data-navigation="">
                        {/**
                         * 모든 페이지에서 같은 높이의 문서 탐색 · 목차 길이와 스크롤 분리
                         */}
                        <div className={clsx("wg_shell__documents", "wg_shell__scroll")} data-navigation-scroll="documents">
                            <WgShellNav site={props.site} docs={props.docs} current={props.current} />
                        </div>
                        {/**
                         * 기본 목차는 문서 아래 · 넓은 화면은 첫 paint 전 같은 DOM을 오른쪽으로 이동
                         */}
                        <div className={clsx("wg_shell__outline")} data-navigation-outline="">
                            <div className={clsx("wg_shell__headings", "wg_shell__scroll")} data-navigation-scroll="outline">
                                {tocGroups.length > 0 && <WgShellToc groups={tocGroups} pageId={props.current === undefined ? "/" : props.current} />}
                            </div>
                        </div>
                    </div>
                </div>
                {/**
                 * 넓은 화면의 오른쪽 목차 · 좁은 화면은 첫 paint 전 같은 DOM을 문서 목록 아래로 이동
                 */}
                <aside className={clsx("wg_shell__tocRail")} data-navigation-rail="" />
                <script dangerouslySetInnerHTML={{__html: navigationScript}} />
                <main className={clsx("wg_shell__main")}>{props.children}</main>
                {/**
                 * 브라우저의 모달 포커스·Escape 처리 · 목록은 한 번만 렌더링
                 */}
                <dialog className={clsx("wg_shell__drawer")} id="fh-navigation-drawer" aria-labelledby="fh-navigation-title" data-navigation-drawer="">
                    <div className={clsx("wg_shell__drawerHeader")}>
                        {/**
                         * 대화상자의 접근 가능한 이름
                         */}
                        <h2 className={clsx("wg_shell__drawerTitle")} id="fh-navigation-title">
                            {copy_nav_title}
                        </h2>
                        {/**
                         * 목록을 스크롤해도 보이는 닫기 동작
                         */}
                        <button className={clsx("wg_shell__drawerClose")} type="button" aria-label={copy_nav_close} data-navigation-close="">
                            <svg className={clsx("wg_shell__menuIcon")} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="m6 6 12 12M18 6 6 18" />
                            </svg>
                        </button>
                    </div>
                    <div className={clsx("wg_shell__drawerContent")} data-navigation-content="" />
                </dialog>
                <img className={clsx("wg_shell__cursorFace")} src={asset_favicon_path} width="24" height="24" alt="" aria-hidden="true" draggable={false} data-cursor-face="" />
                <script type="module" src={props.assets.clientPath} />
            </body>
        </html>
    );
};

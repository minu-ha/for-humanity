import clsx from "clsx";
import type {ReactNode} from "react";
import {toTocGroups} from "@/component/widget/shell/_function/to-toc-groups";
import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import {WgShellNav} from "@/component/widget/shell/_wg-shell-nav";
import {WgShellToc} from "@/component/widget/shell/_wg-shell-toc";
import {asset_client_path, asset_favicon_path, asset_reload_path, asset_style_path} from "@/constant/asset";
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
                <link rel="stylesheet" href={asset_style_path} />
                {props.assets.reload && <script dangerouslySetInnerHTML={{__html: reloadScript}} />}
            </head>
            {/**
             * 문서 탐색·현재 목차·본문 · 브라우저 동작 연결
             */}
            <body className={clsx("wg_shell__root")}>
                {/**
                 * 모든 데스크톱에서 사이트 이름·문서 탐색·목차의 공유 스크롤
                 */}
                <div className={clsx("wg_shell__sidebar")}>
                    <a className={clsx("wg_shell__brand")} href="/" aria-current={props.current === undefined ? "page" : undefined}>
                        {props.site.title}
                    </a>
                    <WgShellNav site={props.site} docs={props.docs} current={props.current} />
                    {tocGroups.length > 0 && <WgShellToc groups={tocGroups} />}
                </div>
                <main className={clsx("wg_shell__main")}>{props.children}</main>
                <img className={clsx("wg_shell__cursorFace")} src={asset_favicon_path} width="24" height="24" alt="" aria-hidden="true" draggable={false} data-cursor-face="" />
                <script type="module" src={asset_client_path} />
            </body>
        </html>
    );
};

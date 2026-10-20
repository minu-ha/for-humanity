import clsx from "clsx";
import {raw} from "hono/html";
import type {Child} from "hono/jsx";
import {createHead, escapeHtml} from "unhead/server";
import type {Link} from "unhead/types";
import {WgShellControls} from "@/component/widget/shell-controls/wg-shell-controls";
import {toNavigationData} from "@/component/widget/sidebar/_function/to-navigation-data/to-navigation-data";
import {asset_favicon_path} from "@/constant/asset";
import type {Doc} from "@/type/doc";
import type {DocOutline} from "@/type/doc-outline";
import type {SiteAssets} from "@/type/site-assets";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {toScriptJson} from "@/util/json/to-script-json";
import "@/style/base.css";
import "@/style/token.css";
import "./wg-shell.css";

/**
 * 공통 HTML 틀의 입력. 문서 탐색, 현재 목차, 본문
 */
export interface WgShellProps {
    /**
     * 검증한 사이트 설정. 탭 제목, 설명, 탐색 순서, 커서 장식
     */
    site: ResolvedSiteConfig;

    /**
     * 사이드바 전체 문서 목록
     */
    docs: Doc[];

    /**
     * 페이지의 글꼴, 스타일, 브라우저 진입점
     */
    assets: SiteAssets;

    /**
     * 탭 제목의 문서 이름. 첫 화면 생략
     */
    title?: string;

    /**
     * 현재 문서 id. 첫 화면 생략
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

    // 요청별 head 격리, 언어와 문서 구조는 Hono 셸 소유
    const head = createHead({disableDefaults: true});

    head.push({
        title: props.title === undefined ? props.site.title : `${props.title} · ${props.site.title}`,
        meta: [
            {charset: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1"},

            // Unhead 속성 직렬화는 따옴표만 escape. 입력의 HTML 엔티티도 텍스트로 보존
            {name: "description", content: props.site.description === undefined ? undefined : escapeHtml(props.site.description)},
        ],
        style: [{textContent: props.assets.fontCss}],
        link: [
            {rel: "icon", href: asset_favicon_path, type: "image/svg+xml"},
            ...props.assets.preload.map<Link>((href) => ({rel: "preload", href, as: "font", type: "font/woff2", crossorigin: ""})),
            ...props.assets.stylePaths.map<Link>((href) => ({rel: "stylesheet", href})),
        ],
    });

    return (
        <html lang="ko">
            {/**
             * Unhead의 서버 직렬화 결과. 글꼴과 CSS는 JavaScript 수신 전에 로드
             */}
            <head>{raw(head.render().headTags)}</head>

            {/**
             * 문서 탐색, 현재 목차, 본문. 브라우저 동작 연결
             */}
            <body className={clsx("wg_shell__root")}>
                {/**
                 * 서버, 브라우저의 공통 셸 조립. 본문 HTML은 마운트 범위에서 제외
                 */}
                <div className={clsx("wg_shell__browserRoot")} data-shell-browser-root="">
                    <WgShellControls data={navigationData} />
                </div>

                {/**
                 * 서버 탐색 자료와 브라우저 진입점 연결
                 */}
                <script type="application/json" id="fh-navigation-data" dangerouslySetInnerHTML={{__html: toScriptJson(navigationData)}} />
                {props.assets.browser.kind === "inline" && <script dangerouslySetInnerHTML={{__html: props.assets.browser.code}} />}
                {props.assets.browser.kind === "module" && <script type="module" src={props.assets.browser.path} />}
                <main className={clsx("wg_shell__main")}>{props.children}</main>
            </body>
        </html>
    );
};

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
import {toAlternates} from "@/util/locale/to-alternates";
import {toPagePath} from "@/util/url/to-page-path";
import {toSitePath} from "@/util/url/to-site-path";
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
     * 페이지의 글꼴, 스타일, 브라우저 진입점, 링크 미리보기 이미지
     */
    assets: SiteAssets;

    /**
     * 탭 제목의 문서 이름. 첫 화면 생략
     */
    title?: string;

    /**
     * 검색 결과와 링크 미리보기의 문서 설명. 첫 화면은 생략, 사이트 설명 사용
     */
    description?: string;

    /**
     * 현재 문서 id. 첫 화면 생략
     */
    current?: string;

    /**
     * 현재 페이지의 번역 언어 코드. 기본 언어는 생략
     */
    locale?: Doc["locale"];

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
    const alternates = toAlternates({site: props.site, docs: props.docs, current: props.current, locale: props.locale});
    const navigationData = toNavigationData({site: props.site, docs: props.docs, current: props.current, outline: props.outline, locale: props.locale, alternates});

    // 요청별 head 격리, 언어와 문서 구조는 Hono 셸 소유
    const head = createHead({disableDefaults: true});

    // 문서는 label, 홈은 언어별 사이트 설명을 페이지가 전달. Unhead 속성 직렬화는 따옴표만 이스케이프, 입력의 HTML 엔티티도 텍스트로 보존
    const descriptionContent = props.description === undefined ? undefined : escapeHtml(props.description);

    // 공개 주소를 지정한 사이트만 대표 주소와 링크 미리보기 출력. 사이트맵과 같은 주소, 번역 홈은 언어 코드가 경로
    const pageUrl = props.site.url === undefined ? undefined : `${props.site.url}${toSitePath({basePath: props.site.basePath, path: toPagePath(props.current ?? props.locale)})}`;

    // 번역이 둘 이상인 페이지만 언어판 링크. 기본 언어판은 x-default 겸함
    const translated = pageUrl === undefined ? [] : alternates.filter((alternate) => alternate.translated);
    const alternateLinks =
        translated.length < 2
            ? []
            : translated.flatMap<Link>((alternate) => {
                  const href = `${props.site.url}${toSitePath({basePath: props.site.basePath, path: alternate.path})}`;

                  return [
                      {rel: "alternate", hreflang: alternate.lang, href} satisfies Link,
                      ...(alternate.code === undefined ? [{rel: "alternate", hreflang: "x-default", href} satisfies Link] : []),
                  ];
              });

    head.push({
        title: props.title === undefined ? props.site.title : `${props.title} | ${props.site.title}`,
        meta: [
            {charset: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1"},

            {name: "description", content: descriptionContent},

            ...(pageUrl === undefined
                ? []
                : [
                      {property: "og:type", content: "website"},
                      {property: "og:site_name", content: escapeHtml(props.site.title)},
                      {property: "og:title", content: escapeHtml(props.title ?? props.site.title)},
                      {property: "og:description", content: descriptionContent},
                      {property: "og:url", content: pageUrl},
                      {property: "og:image", content: props.assets.image},
                      {name: "twitter:card", content: "summary"},
                  ]),
        ],
        style: [{textContent: props.assets.fontCss}],
        link: [
            // 인라인 번들 실행 전 첫 페인트 보류. body의 스크립트는 렌더를 막지 못하므로 Chromium의 expect 링크가 번들 뒤 마커까지 대기
            ...(props.assets.browser.kind === "inline" ? [{rel: "expect", href: "#fh-browser-ready", blocking: "render"} satisfies Link] : []),
            {rel: "icon", href: toSitePath({basePath: props.site.basePath, path: asset_favicon_path}), type: "image/svg+xml"},
            ...(pageUrl === undefined ? [] : [{rel: "canonical", href: pageUrl} satisfies Link]),
            ...alternateLinks,
            ...props.assets.preload.map<Link>((href) => ({
                rel: "preload",
                href: toSitePath({basePath: props.site.basePath, path: href}),
                as: "font",
                type: "font/woff2",
                crossorigin: "",
            })),
            ...props.assets.stylePaths.map<Link>((href) => ({rel: "stylesheet", href: toSitePath({basePath: props.site.basePath, path: href})})),
        ],

        // 저장소 소스 개발의 모듈 진입점. 탐색 마운트 전 첫 페인트 차단, Chromium의 render-blocking
        script:
            props.assets.browser.kind === "module" ? [{type: "module", src: toSitePath({basePath: props.site.basePath, path: props.assets.browser.path}), blocking: "render"}] : [],
    });

    return (
        <html lang={props.locale ?? props.site.lang} className={clsx("wg_shell__document")}>
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
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: toScriptJson이 script 종료 태그와 줄 구분자를 이스케이프한 JSON */}
                <script type="application/json" id="fh-navigation-data" dangerouslySetInnerHTML={{__html: toScriptJson(navigationData)}} />
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 패키지에 포함한 브라우저 번들. 문서 입력 미포함 */}
                {props.assets.browser.kind === "inline" && <script dangerouslySetInnerHTML={{__html: props.assets.browser.code}} />}
                {/**
                 * 인라인 번들 실행 완료 지점. head의 expect 링크가 이 요소까지 첫 페인트 보류
                 */}
                {props.assets.browser.kind === "inline" && <div id="fh-browser-ready" hidden />}
                <main className={clsx("wg_shell__main")}>{props.children}</main>
            </body>
        </html>
    );
};

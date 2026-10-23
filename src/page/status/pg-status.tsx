import clsx from "clsx";
import {raw} from "hono/html";
import {UiStatus, type UiStatusProps} from "@/component/ui/status/ui-status";
import {asset_favicon_path} from "@/constant/asset";
import type {SiteAssets} from "@/type/site-assets";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {toSitePath} from "@/util/url/to-site-path";
import "@/style/base.css";
import "@/style/token.css";
import "./pg-status.css";

/**
 * 탐색과 브라우저 스크립트가 없는 상태 문서의 입력
 */
export interface PgStatusProps {
    /**
     * HTML 언어, 사이트 이름과 배포 경로
     */
    site: ResolvedSiteConfig;

    /**
     * 문서와 동일한 글꼴과 스타일 자원
     */
    assets: SiteAssets;

    /**
     * 상태 번호, 안내, 이미지와 복귀 링크
     */
    status: UiStatusProps;
}

export const PgStatus = (props: PgStatusProps) => {
    return (
        <html className={clsx("pg_status__document")} lang={props.site.lang}>
            {/**
             * 검색 제외와 JavaScript 없는 테마, 글꼴 적용
             */}
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="robots" content="noindex, follow" />
                <title>{`${props.status.code} ${props.status.title} | ${props.site.title}`}</title>
                <link rel="icon" href={toSitePath({basePath: props.site.basePath, path: asset_favicon_path})} type="image/svg+xml" />
                <style>{raw(props.assets.fontCss)}</style>
                {props.assets.stylePaths.map((path) => (
                    <link key={path} rel="stylesheet" href={toSitePath({basePath: props.site.basePath, path})} />
                ))}
            </head>

            {/**
             * 전체 화면 중앙의 상태 안내와 복귀 경로
             */}
            <body className={clsx("pg_status__root")}>
                <main className={clsx("pg_status__main")}>
                    <UiStatus {...props.status} />
                </main>
            </body>
        </html>
    );
};

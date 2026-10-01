import {Hono} from "hono";
import {ssgParams} from "hono/ssg";
import type {ReactElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {PgDoc} from "@/page/doc/pg-doc";
import {PgHome} from "@/page/home/pg-home";
import type {Doc} from "@/type/doc";
import type {DocContent} from "@/type/doc-content";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";

/**
 * 페이지 앱 입력 계약
 */
export interface AppOptions {
    /**
     * 검증된 사이트 설정
     */
    site: SiteConfig;
    /**
     * 렌더링 대상 홈과 문서 · dev 재처리 시 함께 교체
     */
    store: {docs: Doc[]; home?: DocContent};
    /**
     * HTML 머리에 포함할 공통 자원
     */
    assets: SiteAssets;
}

/**
 * React 서버 렌더링 · 브라우저 React 번들 없음
 */
const toHtml = (page: ReactElement) => {
    return `<!DOCTYPE html>${renderToStaticMarkup(page)}`;
};

/**
 * 첫 화면 / · 문서 /:slug{.+}/ · 하위 폴더 id 지원
 * 자원 wildcard와 정규식 매개변수 혼합 시 TrieRouter fallback으로 중첩 경로 불일치
 * 자원·SSE는 dev.ts의 별도 앱 소유
 */
export const createApp = (options: AppOptions) => {
    const app = new Hono();

    app.get("/", (c) => c.html(toHtml(<PgHome site={options.site} docs={options.store.docs} assets={options.assets} home={options.store.home} />)));
    app.get(
        "/:slug{.+}/",
        ssgParams(() => options.store.docs.map((doc) => ({slug: doc.id}))),
        (c) => {
            const doc = options.store.docs.find((entry) => entry.id === c.req.param("slug"));

            return doc === undefined ? c.notFound() : c.html(toHtml(<PgDoc site={options.site} docs={options.store.docs} assets={options.assets} doc={doc} />));
        },
    );

    return app;
};

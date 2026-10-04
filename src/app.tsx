import {Hono} from "hono";
import {html} from "hono/html";
import type {Child} from "hono/jsx";
import {ssgParams} from "hono/ssg";
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
 * Hono JSX 페이지에 HTML 문서 선언 추가 · 서버와 정적 출력에서 같은 렌더러 사용
 */
const toHtml = (page: Child) => {
    return html`<!DOCTYPE html>${page}`;
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

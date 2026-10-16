import {Hono} from "hono";
import {ssgParams} from "hono/ssg";
import {toHtml} from "@/app/_function/to-page-app/_to-html";
import {PgDoc} from "@/page/doc/pg-doc";
import {PgHome} from "@/page/home/pg-home";
import type {Doc} from "@/type/doc";
import type {DocContent} from "@/type/doc-content";
import type {SiteAssets} from "@/type/site-assets";
import type {ResolvedSiteConfig} from "@/type/site-config";

/**
 * 페이지 앱 입력 계약
 */
export interface PageParams {
    /**
     * 검증된 사이트 설정
     */
    site: ResolvedSiteConfig;

    /**
     * 렌더링 대상 홈과 문서. dev 재처리 시 함께 교체
     */
    store: {docs: Doc[]; home?: DocContent};

    /**
     * HTML 머리에 포함할 공통 자원
     */
    assets: SiteAssets;
}

/**
 * 첫 화면 /. 문서 /:slug{.+}/. 하위 폴더 id 지원
 *
 *   - 자원 wildcard와 정규식 매개변수 혼합 시 TrieRouter fallback으로 중첩 경로 불일치
 *   - 자원 응답은 toHttpApp의 별도 앱 소유
 */
export const toPageApp = (options: PageParams) => {
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

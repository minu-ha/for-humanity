import {Hono} from "hono";
import {ssgParams} from "hono/ssg";
import {toHtml} from "@/app/_function/to-html";
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
     * 렌더링 대상 문서와 언어 코드별 README 홈. 기본 언어 홈은 undefined 키, README가 없는 언어는 항목 없음. dev 재처리 시 함께 교체
     */
    store: {docs: Doc[]; homes: Map<Doc["locale"], DocContent>};

    /**
     * HTML 머리에 포함할 공통 자원
     */
    assets: SiteAssets;
}

/**
 * 첫 화면 /, 번역 홈 /<code>/와 문서 /:slug{.+}/의 페이지 앱. 하위 폴더 id 지원
 *
 *   - 자원 와일드카드와 정규식 매개변수 혼합 시 TrieRouter 폴백으로 중첩 경로 불일치
 *   - 같은 이유로 번역 홈은 정적 라우트 대신 문서 라우트의 언어 코드 slug로 처리
 *   - 자원 응답은 toHttpApp의 별도 앱 소유
 */
export const toPageApp = (params: PageParams) => {
    const app = new Hono();

    app.get("/", (c) => c.html(toHtml(<PgHome site={params.site} docs={params.store.docs} assets={params.assets} home={params.store.homes.get(undefined)} />)));

    app.get(
        "/:slug{.+}/",
        ssgParams((_c) => [...params.site.locales.map((locale) => ({slug: locale.code})), ...params.store.docs.map((doc) => ({slug: doc.id}))]),
        (c) => {
            const slug = c.req.param("slug");
            const locale = params.site.locales.find((entry) => entry.code === slug);

            if (locale !== undefined) {
                return c.html(toHtml(<PgHome site={params.site} docs={params.store.docs} assets={params.assets} home={params.store.homes.get(locale.code)} locale={locale} />));
            }

            const doc = params.store.docs.find((entry) => entry.id === slug);

            return doc === undefined ? c.notFound() : c.html(toHtml(<PgDoc site={params.site} docs={params.store.docs} assets={params.assets} doc={doc} />));
        },
    );

    return app;
};

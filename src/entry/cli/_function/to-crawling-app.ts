import {Hono} from "hono";
import {html} from "hono/html";
import {crawling_robots_path, crawling_sitemap_path} from "@/entry/cli/_constant/crawling";
import type {AppOptions} from "@/entry/cli/_function/create-app";
import type {SiteConfig} from "@/type/site-config";

/**
 * URL을 명시한 공개 프로젝트의 크롤러 응답 입력
 */
export interface CrawlingParams {
    /**
     * 설정 검증에서 루트 origin으로 정규화한 공개 HTTP(S) URL
     */
    url: NonNullable<SiteConfig["url"]>;
    /**
     * dev 파일 변경 시 교체되는 현재 문서 목록 · 본문은 사이트맵에 포함하지 않음
     */
    store: AppOptions["store"];
}

/**
 * dev와 정적 빌드에서 같은 크롤러 파일 생성 · 정책·수정 시각은 추정하지 않음
 */
export const toCrawlingApp = (params: CrawlingParams) => {
    const app = new Hono();

    app.get(crawling_robots_path, (c) => c.text(`User-agent: *\nAllow: /\n\nSitemap: ${params.url}${crawling_sitemap_path}\n`));
    app.get(
        crawling_sitemap_path,
        (_c) =>
            new Response(
                html`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${params.url}/</loc></url>
${params.store.docs.map((doc) => html`<url><loc>${params.url}/${doc.id.split("/").map(encodeURIComponent).join("/")}/</loc></url>`)}
</urlset>`.toString(),
                {headers: {"Content-Type": "application/xml; charset=utf-8"}},
            ),
    );

    return app;
};

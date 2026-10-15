import {readFile} from "node:fs/promises";
import {extname} from "node:path";
import {type Context, Hono} from "hono";
import {crawling_robots_path, crawling_sitemap_path} from "@/app/_constant/crawling";
import {asset_content_type_default, asset_content_types, asset_dir, asset_favicon_path} from "@/constant/asset";
import {font_cache_control} from "@/constant/font";

/**
 * 페이지와 등록 자원의 HTTP 응답 계약
 */
export interface HttpParams {
    /**
     * 정적 자원 외 요청을 처리할 페이지 앱
     */
    pages: Hono;
    /**
     * 공개 URL을 설정한 프로젝트의 크롤러 파일 앱
     */
    crawling?: Hono;
    /**
     * 자원 URL → 파일 경로 · 정적 빌드와 동일 목록
     */
    files: Map<string, string>;
}

/**
 * 등록 자원과 크롤러 응답, 나머지 요청은 페이지 앱에 위임
 *
 *   - 정적 생성은 페이지 앱만 사용, 파일 응답과 정규식 페이지 라우트 분리
 */
export const toHttpApp = (options: HttpParams) => {
    const app = new Hono();

    /**
     * 등록된 URL의 자원 응답 · 미등록 시 404
     */
    const handleAsset = async (c: Context) => {
        const file = options.files.get(c.req.path);

        if (file === undefined) {
            return c.notFound();
        }

        c.header("content-type", asset_content_types[extname(file).toLowerCase()] ?? asset_content_type_default);

        if (extname(file) === ".woff2") {
            c.header("Cache-Control", font_cache_control);
        }

        return c.body(await readFile(file));
    };

    app.get(`/${asset_dir}/*`, handleAsset);
    app.get(asset_favicon_path, handleAsset);
    if (options.crawling !== undefined) {
        app.on("GET", [crawling_robots_path, crawling_sitemap_path], (c) => options.crawling?.fetch(c.req.raw, c.env) ?? c.notFound());
    }
    app.all("/*", (c) => options.pages.fetch(c.req.raw, c.env));

    return app;
};

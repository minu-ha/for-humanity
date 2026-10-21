import {readFile} from "node:fs/promises";
import {extname} from "node:path";
import {type Handler, Hono} from "hono";
import {asset_content_type_default, asset_content_types} from "@/app/_constant/asset";
import {http_status_partial_content, http_status_range_not_satisfiable} from "@/app/_constant/http";
import {asset_dir, asset_favicon_path} from "@/constant/asset";
import {font_cache_control} from "@/constant/font";

/**
 * 페이지와 등록 자원의 HTTP 응답 계약
 */
interface HttpParams {
    /**
     * 정적 자원 외 요청을 처리할 페이지 앱
     */
    pages: Hono;

    /**
     * 공개 URL을 설정한 프로젝트의 크롤러 파일 앱
     */
    crawling?: Hono;

    /**
     * 자원 URL별 파일 경로, 정적 빌드와 동일 목록
     */
    files: Map<string, string>;
}

/**
 * 등록 자원과 크롤러 응답, 나머지 요청은 페이지 앱에 위임
 *
 *   - dev 응답 전용. 정적 생성은 페이지 앱과 크롤러 앱을 직접 출력
 *   - 파일 응답과 정규식 페이지 라우트 분리
 */
export const toHttpApp = (params: HttpParams) => {
    const app = new Hono();

    /**
     * 등록된 URL의 자원 응답. 미등록 시 404
     *
     *   - 단일 바이트 범위 요청은 206 부분 응답. Safari의 영상, 소리 재생 조건
     *   - 여러 범위와 형식이 다른 범위 요청은 전체 응답
     */
    const handleAsset: Handler = async (c) => {
        const file = params.files.get(c.req.path);

        if (file === undefined) {
            return c.notFound();
        }

        const extension = extname(file).toLowerCase();

        c.header("content-type", asset_content_types[extension] ?? asset_content_type_default);

        if (extension === ".woff2") {
            c.header("Cache-Control", font_cache_control);
        }

        const body = await readFile(file);
        const range = c.req.header("range")?.match(/^bytes=(\d*)-(\d*)$/);

        c.header("Accept-Ranges", "bytes");

        if (range === undefined || range === null || (range[1] === "" && range[2] === "")) {
            return c.body(body);
        }

        // 시작 생략은 끝에서부터의 길이, 끝 생략은 파일 끝까지
        const start = range[1] === "" ? Math.max(0, body.length - Number(range[2])) : Number(range[1]);
        const end = range[1] === "" || range[2] === "" ? body.length - 1 : Math.min(Number(range[2]), body.length - 1);

        if (start >= body.length || start > end) {
            c.header("Content-Range", `bytes */${body.length}`);

            return c.body(null, http_status_range_not_satisfiable);
        }

        c.header("Content-Range", `bytes ${start}-${end}/${body.length}`);

        return c.body(body.subarray(start, end + 1), http_status_partial_content);
    };

    app.get(`/${asset_dir}/*`, handleAsset);
    app.get(asset_favicon_path, handleAsset);

    if (params.crawling !== undefined) {
        app.route("/", params.crawling);
    }

    app.all("/*", (c) => params.pages.fetch(c.req.raw, c.env));

    return app;
};

import type {EventEmitter} from "node:events";
import {readFile} from "node:fs/promises";
import {extname} from "node:path";
import {type Context, Hono} from "hono";
import {streamSSE} from "hono/streaming";
import {asset_content_type_default, asset_content_types, asset_dir, asset_favicon_path, asset_reload_path} from "@/constant/asset";
import {font_cache_control} from "@/constant/font";
import {crawling_robots_path, crawling_sitemap_path} from "@/entry/cli/_constant/crawling";

/**
 * 개발 서버 입력 계약
 */
export interface DevOptions {
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
    /**
     * 문서 변경 알림 · SSE 새로고침의 change 이벤트
     */
    reload: EventEmitter;
}

/**
 * 개발 전용 자원·SSE와 선택적 크롤러 응답 · 나머지 요청은 페이지 앱에 위임
 * 정적 빌드의 페이지 라우트와 분리
 */
export const createDevApp = (options: DevOptions) => {
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

    app.get(asset_reload_path, (c) =>
        streamSSE(
            c,
            (stream) =>
                new Promise((done) => {
                    /**
                     * 문서 변경의 SSE 전송 · 전송 후 연결 종료
                     */
                    const handleChange = async () => {
                        await stream.writeSSE({data: "change"});
                        done();
                    };

                    options.reload.once("change", handleChange);
                    stream.onAbort(() => {
                        options.reload.off("change", handleChange);
                        done();
                    });
                }),
        ),
    );
    app.get(`/${asset_dir}/*`, handleAsset);
    app.get(asset_favicon_path, handleAsset);
    if (options.crawling !== undefined) {
        app.on("GET", [crawling_robots_path, crawling_sitemap_path], (c) => options.crawling?.fetch(c.req.raw, c.env) ?? c.notFound());
    }
    app.all("/*", (c) => options.pages.fetch(c.req.raw, c.env));

    return app;
};

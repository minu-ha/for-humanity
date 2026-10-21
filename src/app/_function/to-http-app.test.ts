import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {toHttpApp} from "@/app/_function/to-http-app";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 파일 하나만 자원 목록에 등록한 응답 앱
 */
const toAssetApp = (url: string, path: string) => {
    return toHttpApp({
        pages: toPageApp({
            site: siteConfigSchema.parse({}),
            store: {docs: []},
            assets: {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePaths: [asset_style_path]},
        }),
        files: new Map([[url, path]]),
    });
};

describe("자원 응답", () => {
    describe("영상과 소리 형식", () => {
        test.for([
            {name: "clip.mp4", type: "video/mp4"},
            {name: "clip.webm", type: "video/webm"},
            {name: "sound.mp3", type: "audio/mpeg"},
        ])("$name 파일은 $type 형식으로 응답한다", async (scenario, {root}) => {
            /**
             * GIVEN
             * 자원 목록에 등록한 영상이나 소리 파일
             */
            const path = join(root, scenario.name);

            await writeFile(path, "media bytes");

            const app = toAssetApp(`/_fh/media/${scenario.name}`, path);

            /**
             * WHEN
             * 등록한 자원 주소 요청
             */
            const response = await app.request(`/_fh/media/${scenario.name}`);

            /**
             * THEN
             * 성공 응답, 형식별 content-type, 범위 요청 지원 표시
             */
            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toBe(scenario.type);
            expect(response.headers.get("accept-ranges")).toBe("bytes");
        });
    });

    describe("바이트 범위 요청", () => {
        test.for([
            {range: "bytes=2-5", status: 206, contentRange: "bytes 2-5/11", body: "dia "},
            {range: "bytes=6-", status: 206, contentRange: "bytes 6-10/11", body: "bytes"},
            {range: "bytes=-5", status: 206, contentRange: "bytes 6-10/11", body: "bytes"},
            {range: "bytes=20-", status: 416, contentRange: "bytes */11", body: ""},
            {range: "bytes=0-1,3-4", status: 200, contentRange: null, body: "media bytes"},
        ])("$range 요청의 응답 상태는 $status 값이다", async (scenario, {root}) => {
            /**
             * GIVEN
             * 11바이트 영상 파일을 등록한 자원 앱
             */
            const path = join(root, "clip.mp4");

            await writeFile(path, "media bytes");

            const app = toAssetApp("/_fh/media/clip.mp4", path);

            /**
             * WHEN
             * 범위를 지정한 자원 요청과 본문 조회
             */
            const response = await app.request("/_fh/media/clip.mp4", {headers: {range: scenario.range}});
            const body = await response.text();

            /**
             * THEN
             * 범위에 맞는 상태, Content-Range, 본문
             */
            expect(response.status).toBe(scenario.status);
            expect(response.headers.get("content-range")).toBe(scenario.contentRange);
            expect(body).toBe(scenario.body);
        });
    });
});

import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {toHttpApp} from "@/app/_function/to-http-app";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

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

            const app = toHttpApp({
                pages: toPageApp({
                    site: siteConfigSchema.parse({}),
                    store: {docs: []},
                    assets: {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePaths: [asset_style_path]},
                }),
                files: new Map([[`/_fh/media/${scenario.name}`, path]]),
            });

            /**
             * WHEN
             * 등록한 자원 주소 요청
             */
            const response = await app.request(`/_fh/media/${scenario.name}`);

            /**
             * THEN
             * 성공 응답과 형식별 content-type
             */
            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toBe(scenario.type);
        });
    });
});

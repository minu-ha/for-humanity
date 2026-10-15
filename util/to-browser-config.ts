import {fileURLToPath} from "node:url";
import type {InlineConfig} from "vite";

/**
 * 제품과 브라우저 fixture의 동기 Hono DOM 번들 설정
 *
 *   - 스타일은 서버 번들에서 수집, 브라우저 번들에서는 중복 제외
 */
export const toBrowserConfig = (entry: string): InlineConfig => {
    return {
        configFile: false,
        root: fileURLToPath(new URL("../", import.meta.url)),
        publicDir: false,
        resolve: {tsconfigPaths: true},
        oxc: {jsx: {importSource: "hono/jsx/dom"}},
        define: {"process.env.NODE_ENV": '"production"'},
        plugins: [{name: "for-humanity:browser-styles", enforce: "pre", load: {filter: {id: /\.css$/}, handler: () => ""}}],
        build: {
            target: "esnext",
            emptyOutDir: false,
            lib: {entry, formats: ["iife"], name: "ForHumanity", fileName: () => "browser.js"},
        },
    };
};

import {rm} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));

// 이름이 바뀐 번들이 다음 npm 패키지에 남지 않도록 생성물만 비운다.
await rm(new URL("../dist/", import.meta.url), {recursive: true, force: true});

// CLI의 서버 JSX와 CSS · 설치한 패키지는 이 출력만 실행한다.
await build({
    absWorkingDir: root,
    entryPoints: ["src/entry/cli/cli.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    jsx: "automatic",
    outfile: "dist/cli.js",
    logLevel: "info",
});

// 탐색·본문 이벤트·커서를 한 Hono DOM 번들로 컴파일한다.
await build({
    absWorkingDir: root,
    entryPoints: ["src/entry/browser/browser.tsx"],
    bundle: true,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    jsxImportSource: "hono/jsx/dom",
    loader: {".css": "empty"},
    minify: true,
    define: {"process.env.NODE_ENV": '"production"'},
    outfile: "dist/browser.js",
    logLevel: "info",
});

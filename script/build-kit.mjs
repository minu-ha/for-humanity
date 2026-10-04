import {fileURLToPath} from "node:url";
import {build} from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));

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

// 브라우저 진입점의 JSX는 Hono DOM 렌더러로 컴파일한다.
await build({
    absWorkingDir: root,
    entryPoints: ["src/client.ts"],
    bundle: true,
    platform: "browser",
    format: "esm",
    jsx: "automatic",
    minify: true,
    define: {"process.env.NODE_ENV": '"production"'},
    outfile: "dist/client.js",
    logLevel: "info",
});

await build({
    absWorkingDir: root,
    entryPoints: ["src/navigation.tsx"],
    bundle: true,
    platform: "browser",
    format: "iife",
    jsx: "automatic",
    jsxImportSource: "hono/jsx/dom",
    loader: {".css": "empty"},
    minify: true,
    define: {"process.env.NODE_ENV": '"production"'},
    outfile: "dist/navigation.js",
    logLevel: "info",
});

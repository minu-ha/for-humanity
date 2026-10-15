import {readdir, readFile, rm, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
import {z} from "zod";

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

// 공식 Mermaid의 동적 import 경계를 별도 ESM으로 유지. 진입·공유 모듈은 import 시, 유형별 렌더러는 필요할 때 수신한다.
const mermaid = await build({
    absWorkingDir: root,
    entryPoints: {mermaid: fileURLToPath(import.meta.resolve("mermaid"))},
    bundle: true,
    platform: "browser",
    format: "esm",
    splitting: true,
    minify: true,
    entryNames: "[name]-[hash]",
    chunkNames: "chunk-[hash]",
    outdir: "dist/mermaid",
    metafile: true,
    logLevel: "info",
});

// npm 런타임 의존 없이 재배포하는 번들. 실제 포함한 패키지의 라이선스 원문과 고지 동봉.
const packages = new Set(
    Object.keys(mermaid.metafile.inputs).map((input) => {
        const absolute = resolve(root, input).replaceAll("\\", "/");
        const marker = absolute.lastIndexOf("/node_modules/") + "/node_modules/".length;
        const name = absolute.slice(marker).split("/");
        return absolute.slice(0, marker) + name.slice(0, name[0].startsWith("@") ? 2 : 1).join("/");
    }),
);
const notices = await Promise.all(
    [...packages].toSorted().map(async (directory) => {
        const manifest = z
            .object({name: z.string(), version: z.string(), license: z.string().optional()})
            .parse(JSON.parse(await readFile(join(directory, "package.json"), "utf8")));
        const files = (await readdir(directory, {withFileTypes: true})).filter((file) => file.isFile() && /^(licen[cs]e|copying|notice)([.-]|$)/i.test(file.name));
        const licenses = await Promise.all(files.map(async (file) => `${file.name}\n${await readFile(join(directory, file.name), "utf8")}`));
        return [`${manifest.name}@${manifest.version}`, ...(manifest.license === undefined ? [] : [`License: ${manifest.license}`]), ...licenses].join("\n\n");
    }),
);
await writeFile(new URL("../dist/mermaid/THIRD-PARTY-NOTICES.txt", import.meta.url), notices.join("\n\n----------------------------------------\n\n"));

// 공개 설정 모듈과 타입 선언 생성, 소비 프로젝트의 경로 별칭 의존 제외
await build({
    absWorkingDir: root,
    entryPoints: ["src/type/site-config.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    outfile: "dist/config.js",
});

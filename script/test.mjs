import {spawnSync} from "node:child_process";
import {readdir} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const outDir = "node_modules/.cache/for-humanity-tests";
const entryPoints = [
    "src/util/async/to-change-queue.test.ts",
    "src/util/font/to-font-css.test.ts",
    "src/content/read-docs.test.ts",
    "src/store/navigation/create-navigation-stores.test.ts",
];

// 소스 테스트를 실행용 ESM으로 바꾸고 명시한 출력만 실행해 오래된 캐시를 제외한다.
await build({
    absWorkingDir: root,
    entryPoints,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    outbase: "src",
    outdir: outDir,
    outExtension: {".js": ".mjs"},
    logLevel: "info",
});

const sourceTests = entryPoints.map((entry) => join(outDir, entry.slice("src/".length).replace(/\.ts$/, ".mjs")));
const utilityTests = (await readdir(join(root, "util"))).filter((file) => file.endsWith(".test.mjs")).map((file) => join("util", file));
const result = spawnSync(process.execPath, ["--test", ...sourceTests, ...utilityTests], {cwd: root, stdio: "inherit"});

if (result.error !== undefined) throw result.error;
process.exitCode = result.status === null ? 1 : result.status;

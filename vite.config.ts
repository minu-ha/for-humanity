import {fileURLToPath} from "node:url";
import {defineConfig} from "vite";

// biome-ignore lint/style/noRestrictedImports: Vite 설정 부트스트랩은 tsconfig 별칭 해석 전 실행
import {toBrowserConfig} from "./util/to-browser-config.ts";

// biome-ignore lint/style/noRestrictedImports: Vite 설정 부트스트랩은 tsconfig 별칭 해석 전 실행
import {toNoticesPlugin} from "./util/to-notices-plugin.ts";

export default defineConfig((environment) => {
    if (environment.mode === "browser") {
        return toBrowserConfig("src/entry/browser/browser.tsx");
    }

    if (environment.mode === "mermaid") {
        return {
            publicDir: false,
            plugins: [toNoticesPlugin()],
            build: {
                target: "esnext",
                outDir: "dist/mermaid",
                emptyOutDir: false,
                lib: {entry: fileURLToPath(import.meta.resolve("mermaid")), formats: ["es"]},
                rolldownOptions: {output: {entryFileNames: "mermaid-[hash].js", chunkFileNames: "chunk-[hash].js"}},
            },
        };
    }

    return {
        publicDir: false,
        resolve: {tsconfigPaths: true},
        oxc: {jsx: {importSource: "hono/jsx"}},
        build: {
            target: "node22",
            ssr: true,
            emitAssets: true,
            emptyOutDir: true,
            cssCodeSplit: false,
            lib: {entry: {cli: "src/entry/cli/cli.ts", config: "src/type/site-config.ts", site: "src/app/load-site.ts"}, formats: ["es"], cssFileName: "cli"},
        },
    };
});

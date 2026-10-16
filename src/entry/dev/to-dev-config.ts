import {realpathSync} from "node:fs";
import {extname, isAbsolute, join, relative, sep} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import devServer from "@hono/vite-dev-server";
import {debounce, escapeRegExp} from "es-toolkit";
import type {InlineConfig} from "vite";
import {z} from "zod";
import {config_file_names} from "@/app/_constant/config";
import type {loadSite, SiteParams} from "@/app/load-site";
import {copy_error_prefix} from "@/constant/copy";
import {dev_ignored_paths, dev_reload_delay_ms} from "@/entry/dev/_constant/dev";
import {toChangeQueue} from "@/util/async/to-change-queue";
import {toErrorMessage} from "@/util/error/to-error-message";

/**
 * 같은 문서 앱을 소스 또는 설치 번들로 실행하는 개발 입력
 */
export interface DevParams extends SiteParams {
    /**
     * 저장소 소스의 JSX 변환과 CSS HMR 활성화
     */
    source: boolean;
}

/**
 * 단일 Vite 서버의 Hono 연결과 문서 갱신 설정
 *
 *   - 소비 프로젝트의 Vite 설정과 환경 파일은 자동 실행하지 않음
 *   - 마지막 정상 스냅샷 유지, 준비 중 새 변경과 서버 종료 이후 결과 제외
 */
export const toDevConfig = (params: DevParams): InlineConfig => {
    const root = realpathSync(params.root);
    const kitRoot = realpathSync(params.kitRoot);
    let currentSite: Awaited<ReturnType<typeof loadSite>> | undefined;
    let dispose: (() => void) | undefined;
    let prepare: (() => Promise<void>) | undefined;
    let ready: Promise<void> | undefined;
    const viteEnvPath = fileURLToPath(new URL("./dist/client/env.mjs", import.meta.resolve("vite/package.json")));
    const viteClientPaths = [
        /^\/@vite\/(client|env)(?:\?|$)/,
        ...[`/${relative(kitRoot, viteEnvPath)}`, `/@fs/${viteEnvPath.replace(/^\//, "")}`].map((path) => new RegExp(`^${escapeRegExp(path.replaceAll("\\", "/"))}(?:\\?|$)`)),
    ];
    return {
        configFile: false,
        envDir: false,
        root: kitRoot,
        cacheDir: join(kitRoot, "node_modules/.vite/for-humanity"),
        publicDir: false,
        appType: "custom",
        resolve: {alias: {"@": join(kitRoot, "src")}},
        oxc: {jsx: {importSource: "hono/jsx"}},
        optimizeDeps: {noDiscovery: !params.source},
        server: {
            port: params.site.port,
            strictPort: true,
            host: "localhost",
            fs: {
                allow: [kitRoot],

                // 설치 모드는 정확한 Vite 내부 URL만 통과; dev .의 node_modules까지 차단하지 않음
                deny: [
                    ".env",
                    ".env.*",
                    "*.{crt,pem}",
                    "**/.git/**",
                    "**/*.md",
                    "**/*.mdx",
                    "**/for-humanity.config.*",
                    ...(params.source ? [`${root.replaceAll("\\", "/")}/**`] : []),
                ],
            },
        },
        plugins: [
            {
                name: "for-humanity:documents",
                enforce: "pre",

                // Vite의 resolve 호출 컨텍스트 보존, 서버와 브라우저의 JSX 런타임 분리
                resolveId: function (id, importer, options) {
                    if (!options.ssr && /^hono\/jsx\/jsx-(dev-)?runtime$/.test(id)) {
                        return this.resolve(id.replace("hono/jsx/", "hono/jsx/dom/"), importer, {skipSelf: true});
                    }
                },
                configureServer: (server) => {
                    const state = {generation: 0, closed: false};
                    const refresh = toChangeQueue({
                        run: async () => {
                            if (state.closed) return;
                            const generation = state.generation;

                            // 저장소 자체 모듈의 공개 계약, Vite가 캐시를 무효화한 소스에서 로드
                            const module = params.source ? await server.ssrLoadModule("/src/app/load-site.ts") : await import(pathToFileURL(join(kitRoot, "dist/site.js")).href);
                            const load = z.custom<typeof loadSite>((value) => typeof value === "function").parse(module.loadSite);
                            const nextSite = await load({
                                ...params,
                                root,
                                kitRoot,
                                browser: params.source ? {kind: "module", path: "/src/entry/dev/browser.ts"} : undefined,
                            });
                            if (state.closed || generation !== state.generation) return;
                            currentSite = nextSite;
                            server.hot.send({type: "full-reload"});
                        },
                        onError: (error) => server.config.logger.error(`${copy_error_prefix}: ${toErrorMessage(error)}`),
                    });
                    const reload = debounce(refresh, dev_reload_delay_ms);

                    /**
                     * 문서 루트의 입력과 저장소 TS, TSX 변경만 재처리, CSS는 Vite HMR 사용
                     */
                    const handleChange = (_event: string, file: string) => {
                        const documentPath = relative(root, file);
                        const segments = documentPath.split(sep);
                        const isDocument =
                            documentPath !== ".." &&
                            !isAbsolute(documentPath) &&
                            !documentPath.startsWith(`..${sep}`) &&
                            !segments.some((part) => ["dist", "node_modules", ".git", ".cache"].includes(part));
                        const isSource = params.source && file.startsWith(`${join(kitRoot, "src")}${sep}`) && [".ts", ".tsx"].includes(extname(file));
                        if (ready === undefined || (!isDocument && !isSource) || config_file_names.some((name) => documentPath === name)) return;
                        state.generation += 1;
                        reload();
                    };
                    server.watcher.add(root);
                    server.watcher.on("all", handleChange);
                    dispose = () => {
                        state.closed = true;
                        reload.cancel();
                        server.watcher.off("all", handleChange);
                    };

                    // Vite의 buildStart 이후 첫 요청에서 서버 모듈 준비
                    prepare = refresh;
                },
                closeBundle: () => dispose?.(),
            },
            devServer({
                exclude: params.source
                    ? [
                          ...viteClientPaths,
                          /^\/@id\//,
                          /^\/node_modules\/\.vite\//,
                          /^\/@fs\//,
                          /^\/src\/(component|page|style|store|constant|type|util)\//,
                          /^\/src\/entry\/(browser|dev\/browser\.ts)/,
                      ]
                    : viteClientPaths,
                ignoreWatching: dev_ignored_paths,
                handleHotUpdate: (context) => (context.file.endsWith(".css") ? undefined : []),
                loadModule: async () => {
                    ready ??= prepare?.();
                    await ready;
                    if (currentSite === undefined) throw new Error("문서 준비에 실패했습니다. 위 오류를 수정하면 다시 반영합니다.");
                    const app = currentSite.app;
                    return {fetch: async (request, env) => app.fetch(request, env)};
                },
            }),
        ],
    };
};

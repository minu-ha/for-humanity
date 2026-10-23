import {realpathSync} from "node:fs";
import {extname, join, relative, sep} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import devServer from "@hono/vite-dev-server";
import {debounce, escapeRegExp} from "es-toolkit";
import type {InlineConfig} from "vite";
import {z} from "zod";
import type {loadSite, SiteParams} from "@/app/load-site";
import {config_file_names} from "@/constant/config";
import {copy_error_prefix} from "@/constant/copy";
import {copy_error_prepare} from "@/entry/dev/_constant/copy";
import {watch_ignored_dirs, watch_reload_delay_ms} from "@/entry/dev/_constant/watch";
import {toChangeQueue} from "@/util/async/to-change-queue";
import {toErrorMessage} from "@/util/error/to-error-message";
import {isOutsideRoot} from "@/util/file/is-outside-root";

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
 *   - 마지막 정상 스냅샷 유지, 서버 종료 이후 결과 제외
 *   - 준비 중 새 변경이 생긴 결과는 기존 스냅샷이 있을 때만 제외
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

        // HTML 없는 앱의 진입점과 JSX 변환으로 추가되는 DOM 런타임 사전 탐색
        optimizeDeps: params.source ? {entries: ["src/entry/browser/browser.tsx"], include: ["hono/jsx/dom/jsx-runtime", "hono/jsx/dom/jsx-dev-runtime"]} : {noDiscovery: true},
        server: {
            port: params.site.port,
            strictPort: true,
            host: params.site.host,
            fs: {
                allow: [kitRoot],

                // 설치 모드는 정확한 Vite 내부 URL만 통과. dev .의 node_modules는 차단하지 않음
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

                    /**
                     * 문서 스냅샷 재준비. 실행 중 요청은 다음 1회로 병합
                     */
                    const refresh = toChangeQueue({
                        run: async () => {
                            if (state.closed) {
                                return;
                            }

                            const generation = state.generation;

                            // 저장소 자체 모듈의 공개 계약, Vite가 캐시를 무효화한 소스에서 로드
                            const module = params.source ? await server.ssrLoadModule("/src/app/load-site.ts") : await import(pathToFileURL(join(kitRoot, "dist/site.js")).href);

                            const nextSite = await z.custom<typeof loadSite>((value) => typeof value === "function").parse(module.loadSite)({
                                ...params,
                                root,
                                kitRoot,
                                browser: params.source ? {kind: "module", path: "/src/entry/browser/browser.tsx"} : undefined,
                                stylePaths: params.source ? z.array(z.string()).parse((await server.ssrLoadModule("/src/entry/dev/_constant/style.ts")).style_paths) : undefined,
                            });

                            // 디바운스 중인 재준비는 첫 요청 대기에 미포함, 첫 결과 제외 시 500 응답
                            const isSuperseded = generation !== state.generation && currentSite !== undefined;

                            if (state.closed || isSuperseded) {
                                return;
                            }

                            currentSite = nextSite;

                            // Vite는 연결 전 갱신도 보관, 최초 응답의 불필요한 재접속 제외
                            if (generation > 0) {
                                server.hot.send({type: "full-reload"});
                            }
                        },
                        onError: (error) => {
                            server.config.logger.error(`${copy_error_prefix}: ${toErrorMessage(error)}`);
                        },
                    });

                    /**
                     * 연속 저장을 한 번의 재준비로 병합
                     */
                    const reload = debounce(refresh, watch_reload_delay_ms);

                    /**
                     * 문서와 소스 변경 시 스냅샷 갱신, 기존 CSS 수정은 Vite HMR 사용
                     */
                    const handleChange = (event: string, file: string) => {
                        const documentPath = relative(root, file);

                        const isDocument = !isOutsideRoot(documentPath) && !documentPath.split(sep).some((part) => watch_ignored_dirs.includes(part.toLowerCase()));

                        const extension = extname(file);

                        const isSource =
                            params.source &&
                            file.startsWith(`${join(kitRoot, "src")}${sep}`) &&
                            ([".ts", ".tsx"].includes(extension) || (extension === ".css" && event !== "change"));

                        if (ready === undefined || (!isDocument && !isSource) || config_file_names.some((name) => documentPath === name)) {
                            return;
                        }

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
                closeBundle: () => {
                    return dispose?.();
                },
            },
            devServer({
                base: params.site.basePath,
                exclude: (params.source
                    ? [
                          ...viteClientPaths,
                          /^\/@id\//,
                          /^\/node_modules\/\.vite\//,
                          /^\/@fs\//,
                          /^\/src\/(component|page|style|store|constant|type|util)\//,
                          /^\/src\/entry\/browser\//,
                      ]
                    : viteClientPaths
                ).map((pattern) => new RegExp(`^${escapeRegExp(params.site.basePath.slice(0, -1))}${pattern.source.slice(1)}`, pattern.flags)),
                ignoreWatching: watch_ignored_dirs.map((dir) => `**/${dir}/**`),
                handleHotUpdate: (context) => {
                    return context.file.endsWith(".css") ? undefined : [];
                },
                loadModule: async () => {
                    ready ??= prepare?.();
                    await ready;

                    if (currentSite === undefined) {
                        throw new Error(copy_error_prepare);
                    }

                    const app = currentSite.app;

                    return {
                        fetch: async (request, env) => {
                            return app.fetch(request, env);
                        },
                    };
                },
            }),
        ],
    };
};

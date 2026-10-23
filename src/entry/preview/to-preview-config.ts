import {existsSync} from "node:fs";
import {readFile} from "node:fs/promises";
import {join, relative, resolve} from "node:path";
import type {InlineConfig} from "vite";
import {http_status_not_found} from "@/app/_constant/http";
import type {SiteParams} from "@/app/load-site";
import {asset_font_dir, asset_not_found_path} from "@/constant/asset";
import {font_cache_control} from "@/constant/font";
import {copy_error_missing_build} from "@/entry/preview/_constant/copy";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {isOutsideRoot} from "@/util/file/is-outside-root";

/**
 * 정적 미리보기 실행 입력
 */
interface PreviewParams {
    /**
     * dist 출력 폴더를 포함한 문서 루트
     */
    root: SiteParams["root"];

    /**
     * 사용할 HTTP 포트, 0은 운영체제 배정
     */
    port: ResolvedSiteConfig["port"];

    /**
     * 루프백, LAN 전체 또는 특정 인터페이스의 수신 주소
     */
    host: ResolvedSiteConfig["host"];

    /**
     * 미리보기 URL의 배포 경로
     */
    basePath: ResolvedSiteConfig["basePath"];
}

/**
 * 빌드된 사이트 전용 Vite 설정. 소비 프로젝트의 설정과 환경 파일 자동 로드 제외
 */
export const toPreviewConfig = (params: PreviewParams): InlineConfig => {
    const outDir = resolve(params.root, "dist");

    if (!existsSync(join(outDir, "index.html"))) {
        throw new Error(`${copy_error_missing_build}: ${outDir}`);
    }

    return {
        configFile: false,
        envDir: false,
        base: params.basePath,
        root: params.root,
        publicDir: false,
        appType: "mpa",
        build: {outDir},
        preview: {port: params.port, strictPort: true, host: params.host},
        plugins: [
            {
                name: "for-humanity:preview",
                configurePreviewServer: (server) => {
                    server.middlewares.use((request, response, next) => {
                        if (request.url?.startsWith(`${params.basePath}${asset_font_dir.slice(1)}/`)) {
                            response.setHeader("Cache-Control", font_cache_control);
                        }

                        next();
                    });

                    // 정적 파일 조회 실패 시 장기 캐시 제거
                    return () => {
                        server.middlewares.use((request, response, next) => {
                            response.removeHeader("Cache-Control");

                            // Vite의 HTML 경로 변환 이후 남은 폴더 주소, 끝 슬래시 없이도 index.html 조회
                            if (request.url !== undefined && request.url.split("?")[0] === request.originalUrl?.slice(params.basePath.length - 1).split("?")[0]) {
                                request.url = request.url.replace(/\/?(?=\?|$)/, "/index.html");
                            }

                            next();
                        });

                        server.middlewares.use(async (request, response, next) => {
                            if (request.url === undefined || (request.method !== "GET" && request.method !== "HEAD") || !existsSync(join(outDir, asset_not_found_path))) {
                                next();

                                return;
                            }

                            try {
                                const url = request.url.split(/[?#]/)[0];
                                const path = join(outDir, decodeURIComponent(url));

                                // Vite의 후속 HTML 응답 대상, 생성된 문서의 정상 응답 유지
                                if (url.endsWith(".html") && !isOutsideRoot(relative(outDir, path)) && existsSync(path)) {
                                    next();

                                    return;
                                }

                                const html = await readFile(join(outDir, asset_not_found_path));

                                response.statusCode = http_status_not_found;
                                response.setHeader("Content-Type", "text/html; charset=utf-8");
                                response.end(request.method === "HEAD" ? undefined : html);
                            } catch (error) {
                                next(error);
                            }
                        });
                    };
                },
            },
        ],
    };
};

import {existsSync} from "node:fs";
import {join, resolve} from "node:path";
import type {InlineConfig} from "vite";
import type {SiteParams} from "@/app/load-site";
import {asset_font_dir} from "@/constant/asset";
import {font_cache_control} from "@/constant/font";
import {copy_error_missing_build} from "@/entry/preview/_constant/copy";
import type {ResolvedSiteConfig} from "@/type/site-config";

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
        root: params.root,
        publicDir: false,
        appType: "mpa",
        build: {outDir},
        preview: {port: params.port, strictPort: true, host: "localhost"},
        plugins: [
            {
                name: "for-humanity:preview",
                configurePreviewServer: (server) => {
                    server.middlewares.use((request, response, next) => {
                        if (request.url?.startsWith(`${asset_font_dir}/`)) {
                            response.setHeader("Cache-Control", font_cache_control);
                        }

                        next();
                    });

                    // 정적 파일 조회 실패 시 장기 캐시 제거
                    return () => {
                        server.middlewares.use((request, response, next) => {
                            response.removeHeader("Cache-Control");

                            // Vite의 HTML 경로 변환 이후 남은 폴더 주소, 끝 슬래시 없이도 index.html 조회
                            if (request.url !== undefined && request.url.split("?")[0] === request.originalUrl?.split("?")[0]) {
                                request.url = request.url.replace(/\/?(?=\?|$)/, "/index.html");
                            }

                            next();
                        });
                    };
                },
            },
        ],
    };
};

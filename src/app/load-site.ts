import {readFileSync} from "node:fs";
import {join} from "node:path";
import {crawling_reserved_roots} from "@/app/_constant/crawling";
import {createProcessor} from "@/app/_function/create-processor/create-processor";
import {loadMermaidAssets} from "@/app/_function/load-mermaid-assets";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toCrawlingApp} from "@/app/_function/to-crawling-app";
import {toHttpApp} from "@/app/_function/to-http-app";
import {toPageApp} from "@/app/_function/to-page-app";
import {asset_favicon_path, asset_font_dir, asset_style_path} from "@/constant/asset";
import {font_body_css, font_brand_css, font_mono_css} from "@/constant/font";
import type {SiteAssets} from "@/type/site-assets";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {toAssetPath} from "@/util/file/to-asset-path";
import {toFontCss} from "@/util/font/to-font-css";

/**
 * 개발과 정적 출력이 공유하는 문서 준비 입력
 */
export interface SiteParams {
    /**
     * Markdown과 로컬 참조의 절대 루트
     */
    root: string;

    /**
     * 배포 번들과 내장 자원의 패키지 루트
     */
    kitRoot: string;

    /**
     * 시작 시 검증한 사이트 설정
     */
    site: ResolvedSiteConfig;

    /**
     * 개발 실행기의 브라우저 진입점, 생략 시 배포 번들 사용
     */
    browser?: SiteAssets["browser"];
}

/**
 * 문서, 등록 자원과 Hono 앱의 일관된 스냅샷
 *
 *   - 실패한 준비 결과는 반환하지 않으며 이전 스냅샷 변경 없음
 *   - 파일 조회와 Markdown 변환은 준비 시에만 실행, 페이지 요청에서는 재사용
 */
export const loadSite = async (params: SiteParams) => {
    const mono = toFontCss({css: join(params.kitRoot, font_mono_css), fontDir: asset_font_dir});
    const body = toFontCss({css: join(params.kitRoot, font_body_css), fontDir: asset_font_dir});
    const brand = toFontCss({css: join(params.kitRoot, font_brand_css), fontDir: asset_font_dir});
    const stylePath = params.browser?.kind === "module" ? undefined : toAssetPath({path: asset_style_path, file: join(params.kitRoot, "dist/cli.css")});
    const files = new Map([[asset_favicon_path, join(params.kitRoot, "src/asset/favicon.svg")], ...mono.files, ...body.files, ...brand.files]);
    if (stylePath !== undefined) files.set(stylePath, join(params.kitRoot, "dist/cli.css"));
    const processor = createProcessor({site: params.site, root: params.root, files, mermaid: loadMermaidAssets(params.kitRoot)});
    const [docs, home] = await Promise.all([
        readDocs({root: params.root, processor, reserved: params.site.url === undefined ? undefined : crawling_reserved_roots}),
        readHome({root: params.root, processor}),
    ]);
    const store = {docs, home};
    const pages = toPageApp({
        site: params.site,
        store,
        assets: {
            stylePath,
            browser: params.browser === undefined ? {kind: "inline", code: readFileSync(join(params.kitRoot, "dist/browser.js"), "utf8")} : params.browser,
            fontCss: [mono.css, body.css, brand.css].join("\n"),
            preload: [...brand.files.keys(), ...mono.files.keys(), ...body.files.keys()],
        },
    });
    const crawling = params.site.url === undefined ? undefined : toCrawlingApp({url: params.site.url, store});
    return {pages, crawling, files, app: toHttpApp({pages, crawling, files})};
};

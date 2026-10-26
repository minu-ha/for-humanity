import {existsSync, readFileSync, realpathSync, statSync} from "node:fs";
import {join, relative} from "node:path";
import {jsx} from "hono/jsx/jsx-runtime";
import {
    copy_error_content_folder,
    copy_error_content_root_missing,
    copy_error_public_missing,
    copy_hint_content_layout,
    copy_not_found_description,
    copy_not_found_title,
    copy_status_home,
} from "@/app/_constant/copy";
import {crawling_reserved_roots} from "@/app/_constant/crawling";
import {http_status_not_found} from "@/app/_constant/http";
import {loadMermaidAssets} from "@/app/_function/load-mermaid-assets";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toCrawlingApp} from "@/app/_function/to-crawling-app";
import {toHtml} from "@/app/_function/to-html";
import {toHttpApp} from "@/app/_function/to-http-app";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {toSiteImagePath} from "@/app/_function/to-site-image-path";
import {asset_favicon_path, asset_font_dir, asset_status_image_path, asset_style_path} from "@/constant/asset";
import {font_body_css, font_brand_css, font_mono_css} from "@/constant/font";
import {PgStatus} from "@/page/status/pg-status";
import type {ContentScope} from "@/type/content-scope";
import type {SiteAssets} from "@/type/site-assets";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {isOutsideRoot} from "@/util/file/is-outside-root";
import {toAssetPath} from "@/util/file/to-asset-path";
import {toFontCss} from "@/util/font/to-font-css";
import {toSitePath} from "@/util/url/to-site-path";

/**
 * 개발과 정적 출력이 공유하는 문서 준비 입력
 */
export interface SiteParams {
    /**
     * Markdown과 로컬 참조의 절대 루트
     */
    root: string;

    /**
     * 개발 실행의 내부 문서 포함, 생략 시 공개 출력
     */
    includePrivate?: boolean;

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

    /**
     * 개발 실행기의 소스 스타일 URL, 생략 시 내용 지문을 붙인 배포 CSS 사용
     */
    stylePaths?: SiteAssets["stylePaths"];
}

/**
 * 문서, 등록 자원과 Hono 앱의 일관된 스냅샷
 *
 *   - 준비 실패 시 결과 미반환, 이전 스냅샷 유지
 *   - 파일 조회와 Markdown 변환은 준비 시에만 실행, 페이지 요청에서는 재사용
 */
export const loadSite = async (params: SiteParams) => {
    const mono = toFontCss({css: join(params.kitRoot, font_mono_css), fontDir: asset_font_dir, basePath: params.site.basePath});
    const body = toFontCss({css: join(params.kitRoot, font_body_css), fontDir: asset_font_dir, basePath: params.site.basePath});
    const brand = toFontCss({css: join(params.kitRoot, font_brand_css), fontDir: asset_font_dir, basePath: params.site.basePath});
    const stylePaths = params.stylePaths ?? [toAssetPath({path: asset_style_path, file: join(params.kitRoot, "dist/cli.css")})];
    const statusImagePath = toAssetPath({path: asset_status_image_path, file: join(params.kitRoot, "src/asset/face-sad.svg")});
    const files = new Map([
        [asset_favicon_path, join(params.kitRoot, "src/asset/favicon.svg")],
        [statusImagePath, join(params.kitRoot, "src/asset/face-sad.svg")],
        ...mono.files,
        ...body.files,
        ...brand.files,
    ]);

    if (params.stylePaths === undefined) {
        files.set(stylePaths[0], join(params.kitRoot, "dist/cli.css"));
    }

    // 문서 범위. 공개 폴더 필수, 내부 폴더 선택, 범위 폴더의 symlink 별칭 금지
    if (!existsSync(params.root) || !statSync(params.root).isDirectory()) {
        throw new Error(`${copy_error_content_root_missing}: ${params.root}`);
    }

    const root = realpathSync(params.root);
    const publicRoot = join(root, params.site.content.public);
    const privateRoot = join(root, params.site.content.private);
    const locales = params.site.locales.map((locale) => ({code: locale.code, root: join(root, locale.code), publicRoot: join(root, locale.code, params.site.content.public)}));

    // 공개 폴더만 필수. 내부 폴더와 번역 폴더는 있을 때만 실제 폴더 검사
    for (const path of [publicRoot, privateRoot, ...locales.flatMap((locale) => [locale.root, locale.publicRoot])]) {
        if (!existsSync(path)) {
            if (path !== publicRoot) {
                continue;
            }

            throw new Error(`${copy_error_public_missing}: ${path}. ${copy_hint_content_layout}`);
        }

        const actual = realpathSync(path);

        if (!statSync(path).isDirectory() || actual !== path || isOutsideRoot(relative(root, actual))) {
            throw new Error(`${copy_error_content_folder}: ${path}`);
        }
    }

    const scope: ContentScope = {root, publicRoot, privateRoot, includePrivate: params.includePrivate === true, locales};
    const processor = toProcessor({site: params.site, scope, files, mermaid: loadMermaidAssets(params.kitRoot)});

    const [docs, homes] = await Promise.all([
        readDocs({scope, processor, reserved: params.site.url === undefined ? undefined : crawling_reserved_roots}),
        Promise.all(
            [{code: undefined, root}, ...locales.filter((locale) => existsSync(locale.root))].map(async (locale) => {
                return {code: locale.code, home: await readHome({dir: locale.root, scope, processor})};
            }),
        ),
    ]);

    // README가 없는 언어는 홈 항목 없이 작성 안내 표시
    const store = {docs, homes: new Map(homes.flatMap((entry) => (entry.home === undefined ? [] : [[entry.code, entry.home] as const])))};

    const assets: SiteAssets = {
        stylePaths,
        browser: params.browser ?? {kind: "inline", code: readFileSync(join(params.kitRoot, "dist/browser.js"), "utf8")},
        fontCss: [mono.css, body.css, brand.css].join("\n"),
        preload: [...brand.files.keys(), ...mono.files.keys(), ...body.files.keys()],

        // 링크 미리보기 이미지. 공개 주소가 있을 때만 배포
        image:
            params.site.url === undefined || params.site.image === undefined
                ? undefined
                : `${params.site.url}${toSitePath({basePath: params.site.basePath, path: toSiteImagePath({scope, files, path: params.site.image})})}`,
    };

    const notFound = String(
        await toHtml(
            jsx(PgStatus, {
                site: params.site,
                assets,
                status: {
                    code: "404",
                    title: copy_not_found_title,
                    description: copy_not_found_description,
                    image: toSitePath({
                        basePath: params.site.basePath,
                        path: params.site.statusImage === undefined ? statusImagePath : toSiteImagePath({scope, files, path: params.site.statusImage}),
                    }),
                    action: {href: params.site.basePath, label: copy_status_home},
                },
            }),
        ),
    );

    const pages = toPageApp({
        site: params.site,
        store,
        assets,
    });

    pages.notFound((c) => c.html(notFound, http_status_not_found));

    const crawling = params.site.url === undefined ? undefined : toCrawlingApp({url: params.site.url, site: params.site, store});

    return {pages, crawling, files, notFound, app: toHttpApp({pages, crawling, files})};
};

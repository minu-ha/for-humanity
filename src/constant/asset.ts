/*
 * 정적 빌드와 dev의 공통 자원 URL
 */

/**
 * 문서 경로와 구분한 자원 폴더
 */
export const asset_dir = "_fh";

/**
 * esbuild의 컴포넌트 CSS 묶음
 */
export const asset_style_path = `/${asset_dir}/style.css`;

/**
 * 테마·목차·hash 보정 브라우저 스크립트
 */
export const asset_client_path = `/${asset_dir}/client.js`;

/**
 * 자체 호스팅 글꼴 폴더
 */
export const asset_font_dir = `/${asset_dir}/fonts`;

/**
 * dev 문서 변경 알림 SSE URL
 */
export const asset_reload_path = `/${asset_dir}/reload`;

/**
 * 탭 아이콘 URL
 */
export const asset_favicon_path = "/favicon.svg";

/**
 * dev 자원 응답의 확장자별 content-type
 */
export const asset_content_types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".woff2": "font/woff2",
    ".svg": "image/svg+xml",
};

/**
 * 미등록 확장자의 content-type
 */
export const asset_content_type_default = "application/octet-stream";

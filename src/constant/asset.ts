/*
 * 정적 빌드와 dev의 공통 자원 URL
 */

/**
 * 문서 경로와 구분한 자원 폴더
 */
export const asset_dir = "_fh";

/**
 * 내용 지문을 붙일 esbuild CSS의 기본 URL
 */
export const asset_style_path = `/${asset_dir}/style.css`;

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
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".pdf": "application/pdf",
    ".csv": "text/csv; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".zip": "application/zip",
};

/**
 * 미등록 확장자의 content-type
 */
export const asset_content_type_default = "application/octet-stream";

/**
 * 문서에서 참조한 그림·첨부 자원의 예약 경로
 */
export const asset_media_dir = `/${asset_dir}/media`;

/**
 * 명시적 로컬 참조로 배포할 수 있는 파일 형식 · 실행 파일·소스·설정 제외
 */
export const asset_media_extensions = new Set([".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".pdf", ".csv", ".txt", ".zip"]);

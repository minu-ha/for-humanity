/*
 * 쪽 (HTML) 밖의 파일이 놓이는 주소. 결과 폴더와 dev 서버가 같은 주소를 쓴다
 */

/**
 * 자원이 모이는 폴더. 문서 주소와 겹치지 않게 밑줄로 시작한다
 */
export const asset_dir = "_fh";

/**
 * 컴포넌트 CSS 를 하나로 묶은 파일. esbuild 가 cli 를 묶을 때 함께 만든다
 */
export const asset_style_path = `/${asset_dir}/style.css`;

/**
 * 브라우저 스크립트 (테마 단추, 읽는 절, #절 맞추기)
 */
export const asset_client_path = `/${asset_dir}/client.js`;

/**
 * React 섬을 이어받는 스크립트. 섬이 있는 쪽만 싣는다
 */
export const asset_island_path = `/${asset_dir}/island.js`;

/**
 * 글꼴 파일이 놓이는 폴더
 */
export const asset_font_dir = `/${asset_dir}/fonts`;

/**
 * dev 에서 문서가 바뀌면 브라우저에 알리는 SSE 주소
 */
export const asset_reload_path = `/${asset_dir}/reload`;

/**
 * 탭 아이콘
 */
export const asset_favicon_path = "/favicon.svg";

/**
 * 확장자별 content-type. dev 서버가 자원을 줄 때 쓴다
 */
export const asset_content_types: Record<string, string> = {
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".woff2": "font/woff2",
	".svg": "image/svg+xml",
};

/**
 * 표에 없는 확장자의 content-type
 */
export const asset_content_type_default = "application/octet-stream";

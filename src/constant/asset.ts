/*
 * 정적 빌드와 dev의 공통 자원 URL
 */

/**
 * 문서 경로와 구분한 자원 폴더
 */
export const asset_dir = "_fh";

/**
 * 내용 지문을 붙일 번들 CSS의 기본 URL
 */
export const asset_style_path = `/${asset_dir}/style.css`;

/**
 * 자체 호스팅 글꼴 폴더
 */
export const asset_font_dir = `/${asset_dir}/fonts`;

/**
 * 자체 호스팅 Mermaid ESM과 지연 청크 폴더
 */
export const asset_mermaid_dir = `/${asset_dir}/mermaid`;

/**
 * 탭 아이콘 URL
 */
export const asset_favicon_path = "/favicon.svg";

/**
 * 문서에서 참조한 그림, 영상, 소리, 첨부 자원의 예약 경로
 */
export const asset_media_dir = `/${asset_dir}/media`;

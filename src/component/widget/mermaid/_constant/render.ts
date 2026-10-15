import type {MermaidConfig} from "mermaid";

/**
 * 원문 크기 제한. Mermaid의 제한 안내 SVG 대신 오류와 원문 표시
 */
export const render_source_max_chars = 50000;

/**
 * 공식 유형별 기본 표현, 자동 실행과 오류 SVG 삽입 제외
 */
export const render_config: MermaidConfig = {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    maxTextSize: render_source_max_chars,
};

/**
 * 공식 어두운 테마, Tree View 기본 검정 글자와 선의 대비 보정
 *
 *   - 제약: Mermaid 12.2의 Tree View 스타일은 공통 테마 글색 미사용
 */
export const render_dark_config: MermaidConfig = {
    ...render_config,
    theme: "redux-dark-color",
    themeVariables: {treeView: {labelColor: "currentColor", lineColor: "currentColor"}},
};

/**
 * SVG 식별자의 128비트 난수. HTTP 문서에서도 사용 가능한 getRandomValues 기준
 */
export const render_id_words = 4;

import type {MermaidConfig} from "mermaid";

/**
 * 원문 크기 제한. Mermaid의 제한 안내 SVG 대신 오류와 원문 표시
 */
export const render_source_max_chars = 50000;

/**
 * 모든 다이어그램의 SVG 스타일. 측정 영역과 표시 영역에 같은 규칙 적용
 *
 *   - 제약: Mermaid 12의 HTML 라벨은 측정 폭이 120px와 정확히 같을 때만 줄바꿈으로 전환. 비교가 빠지면 한 줄이 120px에서 잘려
 *     자동 줄바꿈을 끄고 글자 폭대로 상자를 키움. 줄바꿈은 작성자의 <br> 기준
 */
const render_theme_css = ["foreignObject > div { max-width: none !important; }", ".node rect, .cluster rect { rx: 6px; ry: 6px; }"].join("\n");

/**
 * 사이트 토큰과 같은 글꼴과 밝은 팔레트. 상자는 파란 참조 칩, 선은 강조색 기준
 */
const render_light_variables: MermaidConfig["themeVariables"] = {
    fontFamily: "var(--app-font-body)",
    fontSize: "13px",
    background: "#fff",
    primaryColor: "#e8f0fb",
    primaryTextColor: "#222",
    primaryBorderColor: "#7a9ccb",
    secondaryColor: "#f0eaf9",
    tertiaryColor: "#f5f5f2",
    textColor: "#333",
    lineColor: "#555",
    edgeLabelBackground: "#fff",
    noteBkgColor: "#fbf3d9",
    noteTextColor: "#333",
};

/**
 * 어두운 팔레트. 밝은 팔레트와 같은 자리의 어두운 토큰 값
 *
 *   - 제약: Mermaid 12.2의 Tree View 스타일은 공통 테마 글색 미사용
 */
const render_dark_variables: MermaidConfig["themeVariables"] = {
    ...render_light_variables,
    darkMode: true,
    background: "#181818",
    primaryColor: "#1b2736",
    primaryTextColor: "#eee",
    primaryBorderColor: "#6f8fc2",
    secondaryColor: "#2a2238",
    tertiaryColor: "#222",
    textColor: "#d5d5d5",
    lineColor: "#b5b5b5",
    edgeLabelBackground: "#181818",
    noteBkgColor: "#3d3418",
    noteTextColor: "#eee",
    treeView: {labelColor: "currentColor", lineColor: "currentColor"},
};

/**
 * 공식 유형별 기본 표현, 자동 실행과 오류 SVG 삽입 제외
 */
export const render_config: MermaidConfig = {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    maxTextSize: render_source_max_chars,
    theme: "base",
    themeVariables: render_light_variables,
    themeCSS: render_theme_css,
};

/**
 * 시스템 어두운 테마의 표현
 */
export const render_dark_config: MermaidConfig = {
    ...render_config,
    themeVariables: render_dark_variables,
};

/**
 * SVG 식별자의 128비트 난수. HTTP 문서에서도 사용 가능한 getRandomValues 기준
 */
export const render_id_words = 4;

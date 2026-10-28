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
const render_theme_css = [
    "foreignObject > div { max-width: none !important; }",
    // 본문의 SVG 그림, 인터랙티브 그림과 같은 직각 모서리, 그림자 없는 면, 가는 선
    "rect { rx: 0 !important; ry: 0 !important; }",
    "* { filter: none !important; }",
    ".flowchart-link, .messageLine0, .messageLine1, .relation, .transition { stroke-width: 1.2px !important; }",
].join("\n");

/**
 * token.css의 --app-font-body와 같은 글꼴 목록
 *
 *   - 제약: Mermaid의 최상위 fontFamily는 괄호를 받지 않아 var() 대신 값 그대로 작성
 */
const render_font_family = '"IBM Plex Sans KR", "Monoplex KR", system-ui, sans-serif';

/**
 * 사이트 토큰과 같은 글꼴과 흑백 팔레트. 상자는 accent-soft 바탕에 회색 선, 묶음은 페이지 바탕, 노트는 형광펜 노랑
 */
const render_light_variables: MermaidConfig["themeVariables"] = {
    fontFamily: "var(--app-font-body)",
    fontSize: "14px",
    background: "#fff",
    primaryColor: "#f5f5f2",
    primaryTextColor: "#222",
    primaryBorderColor: "#888",
    secondaryColor: "#fff",
    tertiaryColor: "#fff",
    clusterBkg: "#fff",
    clusterBorder: "#888",
    textColor: "#333",
    lineColor: "#888",
    edgeLabelBackground: "#fff",
    noteBkgColor: "#f4f58a",
    noteBorderColor: "#888",
    noteTextColor: "#222",

    // Mermaid 12 neo 모양의 테두리 그라데이션(왼쪽 진하고 오른쪽 옅음) 제외, 본문 그림처럼 한 색의 선
    useGradient: false,
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
    primaryColor: "#222",
    primaryTextColor: "#eee",
    primaryBorderColor: "#777",
    secondaryColor: "#181818",
    tertiaryColor: "#181818",
    clusterBkg: "#181818",
    clusterBorder: "#777",
    textColor: "#d5d5d5",
    lineColor: "#777",
    edgeLabelBackground: "#181818",
    noteBkgColor: "#666322",
    noteBorderColor: "#777",
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

    // 시퀀스는 그릴 때 이 두 값으로 참여자, 메시지, 노트의 글꼴을 덮어씀. 공식 기본은 trebuchet와 16px
    fontFamily: render_font_family,
    fontSize: 14,
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

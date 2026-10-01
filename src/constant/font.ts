/*
 * 패키지 내장 글꼴 · OFL 라이선스는 각 폴더
 * CLI에서 @font-face와 자원 생성 · token.css에서 --app-font-* 연결
 */

/**
 * 본문 font-family의 CSS 변수
 */
export const font_css_variable_sans = "--app-font-face-sans";

/**
 * 코드·라벨 font-family의 CSS 변수
 */
export const font_css_variable_mono = "--app-font-face-mono";

/**
 * 본문 글꼴 CSS · 패키지 기준 경로 · dynamic subset 92개
 */
export const font_sans_css = "src/asset/font/pretendard/pretendardvariable-dynamic-subset.css";

/**
 * 본문 @font-face의 font-family 이름
 */
export const font_sans_family = "Pretendard Variable";

/**
 * 본문 글꼴 로드 전·미지원 글자의 fallback
 */
export const font_sans_fallbacks = ["system-ui", "Apple SD Gothic Neo", "sans-serif"];

/**
 * 코드 글꼴 CSS · 라틴 subset · 한글은 본문 글꼴
 */
export const font_mono_css = "src/asset/font/jetbrains-mono/jetbrains-mono.css";

/**
 * 코드 @font-face의 font-family 이름
 */
export const font_mono_family = "JetBrains Mono Variable";

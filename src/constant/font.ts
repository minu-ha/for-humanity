/*
 * 글꼴의 @font-face 이름이 담기는 CSS 변수. cli.ts 의 fonts 설정이 등록하고 wg-shell.astro 머리의 <Font> 가 같은 이름으로 넣는다.
 * 컴포넌트가 쓰는 토큰 (--app-font-sans, --app-font-mono) 은 style/token.css 가 이 변수를 받아 만든다
 */

/**
 * 본문 글꼴 (Pretendard)
 */
export const font_css_variable_sans = "--app-font-face-sans";

/**
 * 코드 · 표지 글꼴 (JetBrains Mono)
 */
export const font_css_variable_mono = "--app-font-face-mono";

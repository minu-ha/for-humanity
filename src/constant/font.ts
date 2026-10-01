/*
 * 글꼴. 두 패키지의 CSS 를 cli.ts 가 읽어 @font-face 를 쪽 머리에 넣고 글꼴 파일을 결과 폴더에 복사한다.
 * 컴포넌트가 쓰는 토큰 (--app-font-sans, --app-font-mono) 은 style/token.css 가 아래 변수를 받아 만든다
 */

/**
 * 본문 글꼴의 @font-face 이름이 담기는 CSS 변수
 */
export const font_css_variable_sans = "--app-font-face-sans";

/**
 * 코드 · 표지 글꼴의 @font-face 이름이 담기는 CSS 변수
 */
export const font_css_variable_mono = "--app-font-face-mono";

/**
 * 본문 글꼴 패키지의 CSS. 필요한 글자 조각만 받도록 나눈 (dynamic subset) 가변 글꼴이다
 */
export const font_sans_css = "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";

/**
 * 본문 글꼴 이름. 패키지 CSS 의 font-family 와 글자 그대로 같다
 */
export const font_sans_family = "Pretendard Variable";

/**
 * 본문 글꼴이 오기 전이나 없는 글자에 쓰는 글꼴
 */
export const font_sans_fallbacks = ["system-ui", "Apple SD Gothic Neo", "sans-serif"];

/**
 * 코드 글꼴 패키지의 CSS. 바로 선 굵기 100 ~ 800 의 가변 글꼴이다
 */
export const font_mono_css = "@fontsource-variable/jetbrains-mono/wght.css";

/**
 * 코드 글꼴 이름. 패키지 CSS 의 font-family 와 글자 그대로 같다
 */
export const font_mono_family = "JetBrains Mono Variable";

/**
 * 코드 글꼴에서 받는 글자 조각. 라틴 기본 한 파일만 받는다. 한글은 본문 글꼴로 떨어진다
 */
export const font_mono_subset = "latin-wght-normal";

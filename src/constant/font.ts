/*
 * 글꼴. 파일은 src/asset/font 에 들어 있고 (OFL, 라이선스는 각 폴더), cli.ts 가 CSS 를 읽어 @font-face 를 쪽 머리에 넣고 파일을 결과 폴더에 복사한다.
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
 * 본문 글꼴의 CSS. 패키지 뿌리에서의 자리다. 필요한 글자 조각만 받도록 92 조각으로 나눈 (dynamic subset) 가변 글꼴이다
 */
export const font_sans_css = "src/asset/font/pretendard/pretendardvariable-dynamic-subset.css";

/**
 * 본문 글꼴 이름. CSS 의 font-family 와 글자 그대로 같다
 */
export const font_sans_family = "Pretendard Variable";

/**
 * 본문 글꼴이 오기 전이나 없는 글자에 쓰는 글꼴
 */
export const font_sans_fallbacks = ["system-ui", "Apple SD Gothic Neo", "sans-serif"];

/**
 * 코드 글꼴의 CSS. 라틴 조각 한 파일만 든 가변 글꼴이다. 한글은 본문 글꼴로 떨어진다
 */
export const font_mono_css = "src/asset/font/jetbrains-mono/jetbrains-mono.css";

/**
 * 코드 글꼴 이름. CSS 의 font-family 와 글자 그대로 같다
 */
export const font_mono_family = "JetBrains Mono Variable";

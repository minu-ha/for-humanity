/*
 * 패키지 내장 글꼴 · OFL 라이선스는 각 폴더
 * CLI에서 @font-face와 자원 생성 · font-family는 token.css 소유
 */

/**
 * 본문 영문·코드·흐름도 글꼴 CSS · 패키지 기준 경로 · Regular·SemiBold 두 파일
 */
export const font_mono_css = "src/asset/font/monoplex-kr/monoplex-kr.css";

/**
 * 본문 한글 글꼴 CSS · IBM Plex Sans KR Regular·SemiBold · 한글 unicode-range
 */
export const font_body_css = "src/asset/font/ibm-plex-sans-kr/ibm-plex-sans-kr.css";

/**
 * 사이트 이름 글꼴 CSS · Architects Daughter Regular · 라틴 subset
 */
export const font_brand_css = "src/asset/font/architects-daughter/architects-daughter.css";

/**
 * 늦게 받은 글꼴로 이미 보이는 대체 글꼴을 교체하지 않는 표시 정책
 */
export const font_display_strategy = "optional";

/**
 * 글꼴 파일 내용의 URL 지문 길이 · 파일 변경 시 이전 캐시와 분리
 */
export const font_hash_length = 12;

/**
 * 내용 지문이 붙은 글꼴만 장기 재사용 · CSS와 브라우저 스크립트는 대상 제외
 */
export const font_cache_control = "public, max-age=31536000, immutable";

/**
 * JavaScript 실행 전 적용할 소스 스타일, 전역 기본값 뒤에 소유자 스타일 배치
 */
export const style_paths = ["/src/style/base.css", "/src/style/token.css", ...Object.keys(import.meta.glob(["/src/component/**/*.css", "/src/page/**/*.css"]))];

/**
 * 스니펫 구문, `<<< ./path.ext` 뒤 선택 region과 코드 펜스 메타 허용
 */
export const snippet_pattern = /^<<<\s+(\S+?)(?:#([\w-]+))?(?:\s+(.+?))?\s*$/;

/**
 * region 경계 구문, 주석 형식 무관
 *
 *   - 이름 없는 표시 뒤는 공백, 줄 끝, 닫는 주석의 -->와 *만 허용
 *   - HTML 주석의 닫는 -->는 이름에서 제외
 */
export const snippet_region_pattern = /^\s*\S*\s*#(end)?region(?:\s+(?!-->)([\w-]+)|(?=\s|$|-->|\*))/;

/**
 * 펜스 언어로 치환할 확장자, 미등록 확장자는 원문 사용
 */
export const snippet_language_by_extension: ReadonlyMap<string, string> = new Map([
    [".cjs", "js"],
    [".md", "markdown"],
    [".mjs", "js"],
    [".mts", "ts"],
    [".txt", "text"],
    [".yml", "yaml"],
]);

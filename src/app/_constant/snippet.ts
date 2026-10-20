/**
 * 스니펫 구문, `<<< ./path.ext` 뒤 선택 region과 코드 펜스 메타 허용
 */
export const snippet_pattern = /^<<<\s+(\S+?)(?:#([\w-]+))?(?:\s+(.+?))?\s*$/;

/**
 * region 경계 구문, 주석 형식과 무관하게 이름으로 대응
 */
export const snippet_region_pattern = /^\s*\S*\s*#(end)?region\s+([\w-]+)/;

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

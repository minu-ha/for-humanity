/**
 * 스니펫 줄 · `<<< ./path.ext`, 선택 `#region`, 선택 메타(펜스 메타와 같음)
 */
export const snippet_pattern = /^<<<\s+(\S+?)(?:#([\w-]+))?(?:\s+(.+?))?\s*$/;

/**
 * region 표시 줄 · 주석 모양은 자유 · `#region 이름`, `#endregion 이름`
 */
export const snippet_region_pattern = /^\s*\S*\s*#(end)?region\s+([\w-]+)/;

/**
 * 확장자 → 펜스 언어 · 없으면 확장자 그대로
 */
export const snippet_language_by_extension: Record<string, string> = {
    ".cjs": "js",
    ".md": "markdown",
    ".mjs": "js",
    ".mts": "ts",
    ".txt": "text",
    ".yml": "yaml",
};

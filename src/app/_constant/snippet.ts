/**
 * 스니펫 구문, `<<< ./path.ext` 뒤 선택 region과 코드 펜스 메타 허용
 */
export const snippet_pattern = /^<<<\s+(\S+?)(?:#([\w-]+))?(?:\s+(.+?))?\s*$/;

/**
 * region 경계 구문, 주석 형식 무관. #과 region은 붙여 씀
 *
 *   - 첫째 캡처 그룹은 end, 둘째는 이름. 언어별 구문도 같은 그룹 순서
 *   - 이름 없는 표시 뒤는 공백, 줄 끝, 닫는 주석의 -->와 *만 허용
 *   - HTML 주석의 닫는 -->는 이름에서 제외
 */
export const snippet_region_pattern = /^\s*\S*\s*#(end)?region(?:\s+((?:\w|-(?!->))+)|(?=\s|$|-->|\*))/;

/**
 * # 주석 언어의 region 경계. 공통 구문에 # region, 셸의 # #region 추가
 */
const snippet_region_hash_pattern = /^\s*(?:\S*\s*#|#(?:\s+#)?\s*)(end)?region(?:\s+((?:\w|-(?!->))+)|(?=\s|$|-->|\*))/;

/**
 * C, C++의 region 경계. 공통 구문에 #pragma region 추가
 */
const snippet_region_pragma_pattern = /^\s*(?:\S*\s*#|#pragma\s+)(end)?region(?:\s+((?:\w|-(?!->))+)|(?=\s|$|-->|\*))/;

/**
 * 언어별 추가 region 경계. 다른 언어 파일의 # region, #pragma region은 본문 유지
 *
 *   - 제약: VitePress가 VS Code의 언어별 folding.markers를 주석 형식별로 묶은 표 기준
 *   - 표에 없는 확장자는 snippet_region_pattern 사용
 */
export const snippet_region_pattern_by_extension: ReadonlyMap<string, RegExp> = new Map([
    ...[".py", ".yml", ".yaml", ".sh", ".bash", ".zsh", ".coffee", ".cs", ".ps1"].map((extension) => [extension, snippet_region_hash_pattern] as const),
    ...[".c", ".h", ".cc", ".cpp", ".cxx", ".hh", ".hpp", ".hxx"].map((extension) => [extension, snippet_region_pragma_pattern] as const),
]);

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

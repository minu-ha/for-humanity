/*
 * 화면과 명령에 보이는 문구. 번역 파일로 옮기기 쉽게 한곳에 둔다
 */

/**
 * 설정에 제목이 없을 때 사이드바 맨 위와 탭 제목에 보이는 이름
 */
export const copy_site_title_default = "Documents";

/**
 * 사이드바 전체의 접근 가능한 이름
 */
export const copy_nav_aria_label = "목차";

/**
 * 사이드바 문서 목록 위의 작은 표지
 */
export const copy_nav_docs_label = "문서";

/**
 * 사이드바 목차 위의 작은 표지
 */
export const copy_nav_toc_label = "목차";

/**
 * 첫 화면의 영어 이름. 사이드바 첫 줄, 첫 화면 제목과 눈썹 줄이 쓴다
 */
export const copy_overview_name = "Overview";

/**
 * 첫 화면의 한글 이름. 사이드바 첫 줄에 올리면 뜬다
 */
export const copy_overview_label = "한눈에";

/**
 * 사이드바 첫 줄의 표지. 문서는 이름의 첫 글자를 쓰는데 첫 화면은 그런 글자가 없어 점을 쓴다
 */
export const copy_overview_mark = "·";

/**
 * 테마 단추의 글. 누를 때마다 시스템, 밝게, 어둡게 차례로 바뀐다
 */
export const copy_theme_label = {
	system: "테마 · 시스템",
	light: "테마 · 밝게",
	dark: "테마 · 어둡게",
} as const;

/**
 * 명령이 내는 오류 문구의 머리. 뒤에 무엇이 틀렸는지를 붙인다
 */
export const copy_error_prefix = "for-humanity";

/**
 * 명령 이름이 dev, build, preview 가 아닐 때
 */
export const copy_error_unknown_command = "모르는 명령이다";

/**
 * 설정 파일 (for-humanity.config.mjs) 의 값이 틀렸을 때. 뒤에 어느 항목이 틀렸는지를 붙인다
 */
export const copy_error_config = "설정이 틀렸다";

/**
 * 문서 머리말이 빠졌거나 틀렸을 때. 뒤에 파일과 어느 항목이 틀렸는지를 붙인다
 */
export const copy_error_frontmatter = "머리말이 틀렸다";

/**
 * 두 문서 이름의 첫 글자가 같아 사이드바 표지가 겹칠 때
 */
export const copy_error_mark_clash = "문서 이름의 첫 글자가 겹친다";

/**
 * Markdown 을 그리지 못한 문서가 있을 때. 까닭은 그 앞에 Astro 가 파일과 줄을 들어 먼저 적는다
 */
export const copy_error_render = "그리지 못한 문서가 있다";

/**
 * ```mermaid 원문을 흐름도로 그리지 못했을 때
 */
export const copy_error_flow = "흐름도를 그리지 못했다";

/**
 * 어느 플러그인도 맡지 않은 블록 지시문 (`::이름`) 을 만났을 때. 대개 오타다
 */
export const copy_error_unknown_directive = "모르는 부품이다";

/**
 * 다른 문서의 .md 로 건 링크인데 그 파일이 없을 때. 빌드는 이어 가고 dev toolbar 의 문서 검사에 모인다
 */
export const copy_warn_broken_link = "없는 문서로 건 링크다";

/**
 * 괄호 안이 날짜로 끝나 알약 문구 같은데 설정에 없는 글을 만났을 때. 대개 문구의 오타다
 */
export const copy_warn_unknown_status = "설정에 없는 알약 문구다";

/**
 * dev toolbar 에 보이는 문서 검사 앱의 이름
 */
export const copy_toolbar_name = "문서 검사";

/**
 * 문서 검사에 걸린 것이 없을 때
 */
export const copy_toolbar_empty = "걸린 것이 없다";

/**
 * 쪽지 섬의 제목
 */
export const copy_note_title = "쪽지";

/**
 * 쪽지 섬의 글
 */
export const copy_note_body = "이 쪽지는 React 섬이다. 서버가 그린 단추를 브라우저의 React 가 이어받아 연다.";

/**
 * 쪽지 섬의 닫기 단추
 */
export const copy_note_close = "닫기";

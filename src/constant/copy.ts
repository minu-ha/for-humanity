/*
 * 화면·CLI 공통 문구 · 번역 분리의 단일 출처
 */

/**
 * 사이트 제목의 기본값 · 사이드바와 탭
 */
export const copy_site_title_default = "Documents";

/**
 * 사이드바의 접근 가능한 이름
 */
export const copy_nav_aria_label = "목차";

/**
 * 문서 목록 라벨
 */
export const copy_nav_docs_label = "문서";

/**
 * 현재 문서 목차 라벨
 */
export const copy_nav_toc_label = "목차";

/**
 * 첫 화면 영어 이름 · 목록·제목·머리 라벨
 */
export const copy_overview_name = "Overview";

/**
 * 첫 화면 한글 툴팁
 */
export const copy_overview_label = "한눈에";

/**
 * 첫 화면의 목록 표지 · 문서는 영어 이름 첫 글자
 */
export const copy_overview_mark = "·";

/**
 * 테마 버튼 문구 · 시스템 → 밝게 → 어둡게
 */
export const copy_theme_label = {
    system: "테마 · 시스템",
    light: "테마 · 밝게",
    dark: "테마 · 어둡게",
} as const;

/**
 * CLI 오류 접두사
 */
export const copy_error_prefix = "for-humanity";

/**
 * 미지원 명령 오류
 */
export const copy_error_unknown_command = "모르는 명령이다";

/**
 * 설정 검증 오류 · 항목 경로와 이유 추가
 */
export const copy_error_config = "설정이 틀렸다";

/**
 * 문서 머리말 오류 · 파일과 항목 추가
 */
export const copy_error_frontmatter = "머리말이 틀렸다";

/**
 * 문서 이름의 첫 글자 표지 중복
 */
export const copy_error_mark_clash = "문서 이름의 첫 글자가 겹친다";

/**
 * 빈 id·예약 경로·URL 예약 문자 오류
 */
export const copy_error_doc_id = "문서 id에 사용할 수 없는 경로";

/**
 * 확장자·대소문자 정규화 후 문서 경로 중복
 */
export const copy_error_doc_id_clash = "문서 id가 겹친다";

/**
 * 흐름도 렌더링 실패
 */
export const copy_error_flow = "흐름도를 그리지 못했다";

/**
 * 미지원 블록 지시문 오류
 */
export const copy_error_unknown_directive = "모르는 부품이다";

/**
 * 없는 Markdown 링크 경고 · 빌드 계속
 */
export const copy_warn_broken_link = "없는 문서로 건 링크다";

/**
 * 미등록 날짜 상태 문구 경고
 */
export const copy_warn_unknown_status = "설정에 없는 알약 문구다";

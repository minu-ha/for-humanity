/**
 * 모바일 탐색 전환 · wg-shell.css의 폭 조건과 일치
 */
export const navigation_mobile_query = "(width < 1024px)";

/**
 * 양쪽 240px 탐색·본문 900px·간격 120px와 스크롤바가 들어가는 3열 기준
 */
export const navigation_wide_query = "(width >= 1536px)";

/**
 * 문서·현재 페이지 목차의 접힘 선택 · 기본은 전체 펼침
 */
export const navigation_tree_storage_key = "for-humanity:navigation-tree";

/**
 * 저장 형태가 바뀌면 기존 자료를 기본 상태로 돌리는 persist 버전
 */
export const navigation_storage_version = 1;

/**
 * 같은 탭에서 문서 이동 후 탐색 위치 복원 · 데스크톱과 드로어는 별도 저장
 */
export const navigation_scroll_storage_key = "for-humanity:navigation-scroll";

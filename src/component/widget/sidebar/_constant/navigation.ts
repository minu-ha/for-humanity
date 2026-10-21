import type {Doc} from "@/type/doc";

/**
 * 모바일 탐색 전환. wg-shell.css의 폭 조건과 일치
 */
export const navigation_mobile_query = "(width < 1024px)";

/**
 * 양쪽 200px 탐색, 간격 120px, 최소 800px 본문과 스크롤바가 들어가는 3열 기준
 */
export const navigation_wide_query = "(width >= 1360px)";

/**
 * 하위 문서가 없는 문서 가지의 빈 하위 목록
 */
export const navigation_children_absent: readonly Doc[] = [];

/**
 * 문서 목록 식별값의 base64url 길이. 96비트, 저장 위치 비교 전용
 */
export const navigation_signature_length = 16;

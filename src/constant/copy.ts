/*
 * 소유자가 없는 설정, 경로 검사와 로그의 문구. 소유자 전용 문구는 소유자의 _constant/copy.ts
 */

/**
 * 사이트 제목의 기본값. 사이드바와 탭
 */
export const copy_site_title_default = "for humanity";

/**
 * 터미널 로그 접두사
 */
export const copy_error_prefix = "for-humanity";

/**
 * 공개 사이트 URL의 미지원 경로, 자격 증명, 검색, 앵커 오류
 */
export const copy_error_site_url = "url must be an HTTP(S) site root without credentials, a subpath, a query or a hash";

/**
 * 탐색 순서에 같은 묶음을 두 번 지정한 설정 오류
 */
export const copy_error_navigation_clash = "Duplicate navigation groups";

/**
 * content 경로 설정의 프로젝트 밖, 예약 폴더 오류
 */
export const copy_error_content_path = "Use a relative path inside the project; dist, node_modules and .git are not allowed";

/**
 * 공개 문서 폴더를 content 루트로 지정한 설정 오류
 */
export const copy_error_public_folder = "Public documents need their own subfolder";

/**
 * 내부 문서 폴더를 content 루트로 지정한 설정 오류
 */
export const copy_error_private_folder = "Private documents need their own subfolder";

/**
 * 공개, 내부 문서 폴더의 중복, 중첩 설정 오류
 */
export const copy_error_content_overlap = "Public and private document folders cannot be the same or nested";

/**
 * 문서 범위 밖이나 예약 폴더를 가리키는 참조 오류
 */
export const copy_error_reference_outside = "Reference outside the document scope";

/**
 * 공개 문서에서 내부 자료를 가리키는 참조 오류
 */
export const copy_error_private_reference = "Public documents cannot reference private files";

/**
 * 공개 문서 id가 내부 문서 URL 접두사로 시작하는 오류
 */
export const copy_error_private_id = "The private URL prefix is reserved for internal documents";

/**
 * 공개, 내부 문서 폴더 밖의 Markdown 참조 오류
 */
export const copy_error_markdown_outside = "Markdown reference outside the public and private document folders";

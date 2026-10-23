/**
 * 설정 검증 오류. 항목 경로와 이유 추가
 */
export const copy_error_config = "Invalid configuration";

/**
 * 설정 파일이 둘 이상인 오류
 */
export const copy_error_config_clash = "More than one config file";

/**
 * 대소문자만 다른 README 중복 오류
 */
export const copy_error_home_clash = "More than one home README";

/**
 * 프로젝트 밖을 가리키는 content 루트 오류
 */
export const copy_error_content_root_outside = "The content root must be inside the project";

/**
 * 예약 폴더 안의 content 루트 오류
 */
export const copy_error_content_root_reserved = "The content root cannot be inside dist, .git or node_modules";

/**
 * 없는 content 루트 오류
 */
export const copy_error_content_root_missing = "Content root not found";

/**
 * 없는 공개 문서 폴더 오류
 */
export const copy_error_public_missing = "Public document folder not found";

/**
 * 공개 문서 폴더 누락 시 확인할 설정 안내
 */
export const copy_hint_content_layout = "Check the content/public layout or the content setting";

/**
 * symlink이거나 content 밖에 있는 문서 폴더 오류
 */
export const copy_error_content_folder = "Document folders must be real folders inside the content root";

/**
 * 문서 frontmatter 오류. 파일과 항목 추가
 */
export const copy_error_frontmatter = "Invalid frontmatter";

/**
 * 빈 id, 예약 경로, URL 예약 문자 오류
 */
export const copy_error_doc_id = "Path cannot be used as a document id";

/**
 * 확장자, 대소문자 정규화 후 문서 경로 중복
 */
export const copy_error_doc_id_clash = "Duplicate document ids";

/**
 * 누락되거나 홈을 가리키는 부모 문서 참조
 */
export const copy_error_doc_parent_missing = "Parent document not found";

/**
 * 자기 참조 또는 순환하는 문서 부모 경로
 */
export const copy_error_doc_parent_cycle = "Circular document parents";

/**
 * 분류 경로가 다른 문서 사이의 부모 참조
 */
export const copy_error_doc_parent_group = "Parent document is in another group";

/**
 * 공개 문서의 원시 HTML에서 내부 문서 URL을 가리키는 링크 오류
 */
export const copy_error_private_url = "Public documents cannot link to private URLs";

/**
 * 문서에서 참조한 로컬 자원의 경로, 형식 오류
 */
export const copy_error_asset = "Invalid asset";

/**
 * `<<<`로 불러온 코드 스니펫의 경로, 파일, region 오류
 */
export const copy_error_snippet = "Invalid code snippet";

/**
 * 로컬 참조 오류의 이유. 없는 파일
 */
export const copy_error_file_missing = "file not found";

/**
 * 로컬 참조 오류의 이유. 폴더 등 일반 파일이 아닌 대상
 */
export const copy_error_not_file = "not a regular file";

/**
 * 자원 오류의 이유. 지원하지 않는 이미지 형식
 */
export const copy_error_image_format = "unsupported image format";

/**
 * 자원 오류의 이유. video, audio, source에서 지원하지 않는 형식
 */
export const copy_error_media_format = "unsupported video or audio format";

/**
 * 없는 문서의 상태 제목
 */
export const copy_not_found_title = "Page not found";

/**
 * 없는 문서의 원인과 복귀 안내
 */
export const copy_not_found_description = "This page may have moved or no longer exists. Find your way back from the home page.";

/**
 * 상태 화면의 홈 복귀 링크
 */
export const copy_status_home = "Back to home";

/**
 * 자원 오류의 이유. track에서 WebVTT가 아닌 형식
 */
export const copy_error_track_format = "unsupported text track format";

/**
 * 자원 오류의 이유. embed, object에서 PDF와 이미지가 아닌 형식
 */
export const copy_error_embed_format = "unsupported embedded file format";

/**
 * 배포 형식이 아닌 로컬 파일 링크 경고. 빌드 계속
 */
export const copy_warn_unpublished_file = "Link to a local file that is not published";

/**
 * 스니펫 오류의 이유. 없는 region
 */
export const copy_error_region_missing = "region not found";

/**
 * 스니펫 오류의 이유. 파일 끝까지 닫히지 않은 region
 */
export const copy_error_region_open = "region not closed";

/**
 * 패키지 빌드 전 Mermaid 진입 모듈 누락 오류
 */
export const copy_error_mermaid_entry = "Missing Mermaid browser entry. Run pnpm build:kit before using the CLI";

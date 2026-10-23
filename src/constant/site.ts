/**
 * 설정 파일 부재 시 입력. 스키마 기본값 적용
 */
export const site_config_absent = {};

/**
 * 탐색 순서 생략 시 모든 묶음을 이름순 배치
 */
export const site_navigation_default: string[][] = [];

/**
 * 문서 언어의 기본값. html lang 속성
 */
export const site_lang_default = "ko";

/**
 * 루트 배포의 기본 경로
 */
export const site_base_path_default = "/";

/**
 * 배포 경로의 URL 비예약 문자, 중첩 경로와 끝 슬래시 허용
 */
export const site_base_path_pattern = /^\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]*$/;

/**
 * 언어 태그 구문. ko, en-US처럼 BCP 47의 언어와 하위 태그
 */
export const site_lang_pattern = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

/**
 * 링크 미리보기 이미지 형식. 미리보기 서비스 대부분이 SVG, AVIF 미표시
 */
export const site_image_pattern = /\.(?:png|jpe?g|gif|webp)$/i;

/**
 * 상태 화면의 로컬 이미지 형식, SVG와 AVIF 포함
 */
export const site_status_image_pattern = /\.(?:svg|png|jpe?g|gif|webp|avif)$/i;

/**
 * 커서 장식의 기본값. 설정에서 켠 사이트만 표시
 */
export const site_cursor_face_default = false;

/**
 * dev, preview 서버 기본 포트
 */
export const site_port_default = 4321;

/**
 * dev, preview의 기본 루프백 수신 주소
 */
export const site_host_default = "localhost";

/**
 * 값 없는 --host 옵션의 모든 IPv4 인터페이스 수신
 */
export const site_host_network = "0.0.0.0";

/**
 * 포트 번호 하한. TCP
 */
export const site_port_min = 1;

/**
 * 포트 번호 상한. TCP
 */
export const site_port_max = 65535;

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
 * 언어 태그 구문. ko, en-US처럼 BCP 47의 언어와 하위 태그
 */
export const site_lang_pattern = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

/**
 * 링크 미리보기 이미지 형식. 미리보기 서비스 대부분이 SVG, AVIF 미표시
 */
export const site_image_pattern = /\.(?:png|jpe?g|gif|webp)$/i;

/**
 * 커서 장식의 기본값. 설정에서 켠 사이트만 표시
 */
export const site_cursor_face_default = false;

/**
 * dev, preview 서버 기본 포트
 */
export const site_port_default = 4321;

/**
 * 포트 번호 하한. TCP
 */
export const site_port_min = 1;

/**
 * 포트 번호 상한. TCP
 */
export const site_port_max = 65535;

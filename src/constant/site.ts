/**
 * 설정 파일 부재 시 입력. 스키마 기본값 적용
 */
export const site_config_absent = {};

/**
 * 탐색 순서 생략 시 모든 묶음을 이름순 배치
 */
export const site_navigation_default: string[][] = [];

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

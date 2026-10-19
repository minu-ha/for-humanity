/**
 * 설정 파일 부재 시 입력. 스키마 기본값 적용
 */
export const site_config_absent = {};

/**
 * 탐색 순서 생략 시 모든 묶음을 이름순 배치
 */
export const site_navigation_default: readonly string[] = [];

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

/**
 * 기본 문서 루트와 공개 범위 폴더
 */
export const content_default = {root: "content", public: "public", private: "private"};

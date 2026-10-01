/**
 * 설정 파일 부재 시 입력 · 스키마 기본값 적용
 */
export const site_config_absent = {};

/**
 * 탐색 순서 생략 시 모든 묶음을 이름순 배치
 */
export const site_navigation_default: readonly string[] = [];

/**
 * 저장소 링크에 사용할 서비스 · 자체 호스팅 GitLab도 URL과 아이콘을 분리해 지정
 */
export const site_repository_provider = {github: "github", gitlab: "gitlab"} as const;

/**
 * GitHub Pages 템플릿의 Node 설정 단계
 */
export const deploy_node_step_index = 1;

/**
 * GitHub Pages 템플릿의 패키지 매니저 설정 단계
 */
export const deploy_manager_step_index = 2;

/**
 * GitHub Pages 템플릿의 의존성 설치 단계
 */
export const deploy_install_step_index = 3;

/**
 * GitHub Pages 템플릿의 문서 빌드 단계
 */
export const deploy_build_step_index = 4;

/**
 * GitHub Pages 템플릿의 아티팩트 업로드 단계
 */
export const deploy_artifact_step_index = 5;

/**
 * Workers 배포 파일의 검증한 CLI 버전과 런타임 기준일
 */
export const deploy_workers = {version: "4.152.0", compatibility_date: "2026-10-23", name_length_limit: 63} as const;

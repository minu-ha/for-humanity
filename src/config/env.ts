/**
 * CLI를 실행한 패키지 매니저와 버전, 직접 실행 시 없음
 */
export const env_package_agent = process.env.npm_config_user_agent;

/**
 * 비대화형 실행을 알리는 외부 CI 표시
 */
export const env_ci = process.env.CI;

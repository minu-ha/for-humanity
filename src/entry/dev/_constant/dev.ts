/**
 * 연속 저장을 한 번의 문서 준비로 합치는 대기 시간
 */
export const dev_reload_delay_ms = 150;

/**
 * 생성물과 설치 파일의 변경 제외, 재빌드 반복 방지
 */
export const dev_ignored_paths = ["**/dist/**", "**/node_modules/**", "**/.git/**", "**/.cache/**"];

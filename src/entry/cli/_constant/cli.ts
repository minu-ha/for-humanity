/**
 * 명령 생략 시 dev
 */
export const cli_default_command = "dev";

/**
 * 문서 폴더 생략 시 현재 폴더
 */
export const cli_default_docs_dir = ".";

/**
 * 문서 폴더의 선택 설정 파일
 */
export const cli_config_file_names = ["for-humanity.config.ts", "for-humanity.config.mjs"] as const;

/**
 * 연속 저장을 하나의 문서 갱신으로 합치는 대기 시간 · ms
 */
export const cli_reload_delay_ms = 150;

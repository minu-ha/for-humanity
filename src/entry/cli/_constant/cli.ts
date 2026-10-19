/**
 * 명령 생략 시 dev
 */
export const cli_default_command = "dev";

/**
 * 프로젝트 폴더 생략 시 현재 폴더
 */
export const cli_docs_args = {
    dir: {type: "positional", description: "프로젝트 폴더", default: "."},
} as const;

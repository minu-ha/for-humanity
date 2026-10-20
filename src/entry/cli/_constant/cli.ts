import {copy_dir_description} from "@/entry/cli/_constant/copy";

/**
 * 명령 생략 시 dev
 */
export const cli_default_command = "dev";

/**
 * 프로젝트 폴더 생략 시 현재 폴더
 */
export const cli_docs_args = {
    dir: {type: "positional", description: copy_dir_description, default: "."},
} as const;

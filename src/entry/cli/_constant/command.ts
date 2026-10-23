import {copy_dir_description, copy_host_description} from "@/entry/cli/_constant/copy";

/**
 * 명령 생략 시 dev
 */
export const command_default = "dev";

/**
 * 프로젝트 폴더 생략 시 현재 폴더
 */
export const command_args = {
    dir: {type: "positional", description: copy_dir_description, default: "."},
} as const;

/**
 * dev와 preview의 프로젝트 폴더, 일회성 수신 주소 입력
 */
export const command_server_args = {
    ...command_args,
    host: {type: "string", description: copy_host_description, valueHint: "address"},
} as const;

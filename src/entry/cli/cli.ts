#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import {defineCommand, runMain} from "citty";
import {z} from "zod/mini";
import {command_args, command_default, command_server_args} from "@/entry/cli/_constant/command";
import {copy_build_description, copy_dev_description, copy_error_option, copy_hint_help, copy_preview_description, copy_tool_description} from "@/entry/cli/_constant/copy";
import {init_args, init_copy} from "@/entry/init/_constant/init";
import {logger} from "@/util/logger/logger";

const main = defineCommand({
    /**
     * 설치한 패키지의 명령 이름과 버전
     */
    meta: async () => {
        const content: unknown = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

        return {...z.object({name: z.string(), version: z.string()}).parse(content), description: copy_tool_description};
    },
    default: command_default,

    /**
     * Citty의 미지정 옵션 허용을 제한하는 CLI 입력 경계
     */
    setup: (context) => {
        if (context.rawArgs[0] === "init") {
            return;
        }

        const acceptsHost = context.rawArgs[0] === "dev" || context.rawArgs[0] === "preview";
        const option = Object.entries<unknown>(context.args).find(([key, value]) => key !== "_" && (key !== "host" || value === false || !acceptsHost))?.[0];

        if (option !== undefined) {
            logger.error(`${copy_error_option}: ${option}. ${copy_hint_help}`);
            process.exit(1);
        }
    },
    subCommands: {
        init: defineCommand({
            meta: {name: "init", description: init_copy.description},
            args: init_args,

            /**
             * 도움말 조회와 분리한 초기화 실행
             */
            run: async (context) => {
                const command = await import("@/entry/init/run-init");

                await command.runInit(context.args);
            },
        }),
        ...Object.fromEntries(
            (
                [
                    ["dev", copy_dev_description],
                    ["build", copy_build_description],
                    ["preview", copy_preview_description],
                ] as const
            ).map(([name, description]) => [
                name,
                defineCommand({
                    meta: {name, description},
                    args: name === "build" ? command_args : command_server_args,

                    /**
                     * 도움말 조회와 분리한 사이트 실행
                     */
                    run: async (context) => {
                        const command = await import("@/entry/cli/_function/run-site-command");

                        await command.runSiteCommand({command: name, args: context.args});
                    },
                }),
            ]),
        ),
    },
});

// 수신 옵션으로 시작한 기본 dev 명령을 Citty의 하위 명령 선택 전에 정규화
const rawArgs = process.argv.slice(2);

await runMain(main, {rawArgs: rawArgs[0] === "--host" || rawArgs[0]?.startsWith("--host=") ? [command_default, ...rawArgs] : rawArgs});

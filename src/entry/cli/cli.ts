#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import {defineCommand, runMain} from "citty";
import {z} from "zod/mini";
import {command_args, command_default} from "@/entry/cli/_constant/command";
import {copy_build_description, copy_dev_description, copy_error_option, copy_hint_help, copy_preview_description, copy_tool_description} from "@/entry/cli/_constant/copy";
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
        const option = Object.keys(context.args).find((key) => key !== "_");

        if (option !== undefined) {
            logger.error(`${copy_error_option}: ${option}. ${copy_hint_help}`);
            process.exit(1);
        }
    },
    subCommands: Object.fromEntries(
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
                args: command_args,

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
});

await runMain(main);

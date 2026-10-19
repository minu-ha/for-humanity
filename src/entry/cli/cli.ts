#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import {defineCommand, runMain} from "citty";
import {z} from "zod/mini";
import {cli_default_command, cli_docs_args} from "@/entry/cli/_constant/cli";
import {logger} from "@/util/logger/logger";

const main = defineCommand({
    /**
     * 설치한 패키지의 명령 이름과 버전
     */
    meta: async () => {
        const content: unknown = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
        const manifest = z.object({name: z.string(), version: z.string()}).parse(content);
        return {...manifest, description: "Markdown 문서 사이트 개발·빌드·미리보기"};
    },
    default: cli_default_command,

    /**
     * Citty의 미지정 옵션 허용을 제한하는 CLI 입력 경계
     */
    setup: (context) => {
        const option = Object.keys(context.args).find((key) => key !== "_");
        if (option !== undefined) {
            logger.error(`지원하지 않는 옵션: ${option}. --help로 사용법을 확인하세요`);
            process.exit(1);
        }
    },
    subCommands: {
        dev: defineCommand({
            meta: {name: "dev", description: "문서 변경을 반영하는 개발 서버"},
            args: cli_docs_args,

            /**
             * 도움말 조회와 분리한 사이트 실행
             */
            run: async (context) => {
                const command = await import("@/entry/cli/_function/run-site-command");
                await command.runSiteCommand({command: "dev", args: context.args});
            },
        }),
        build: defineCommand({
            meta: {name: "build", description: "content/dist에 공개 문서 사이트 생성"},
            args: cli_docs_args,

            /**
             * 도움말 조회와 분리한 사이트 실행
             */
            run: async (context) => {
                const command = await import("@/entry/cli/_function/run-site-command");
                await command.runSiteCommand({command: "build", args: context.args});
            },
        }),
        preview: defineCommand({
            meta: {name: "preview", description: "빌드한 정적 사이트의 로컬 미리보기"},
            args: cli_docs_args,

            /**
             * 도움말 조회와 분리한 사이트 실행
             */
            run: async (context) => {
                const command = await import("@/entry/cli/_function/run-site-command");
                await command.runSiteCommand({command: "preview", args: context.args});
            },
        }),
    },
});

await runMain(main);

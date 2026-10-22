import {PassThrough} from "node:stream";
import {box} from "@clack/prompts";
import {getColor} from "consola/utils";
import stringWidth from "string-width";
import wrapAnsi from "wrap-ansi";
import {init_defaults, init_panel_color, init_panel_layout} from "@/entry/init/_constant/init";
import type {InitPanelParams} from "@/entry/init/_type/init-panel";

/**
 * Clack 박스 출력을 안내와 입력 렌더러에서 공유하는 경계
 */
export const toInitPanel = (params: InitPanelParams): string => {
    const width = Math.max(1, Math.min(params.columns ?? init_panel_layout.width, init_panel_layout.width));
    const output = Object.assign(new PassThrough(), {columns: width});
    const chunks: string[] = [];
    output.on("data", (chunk: Buffer) => chunks.push(chunk.toString()));

    if (width < init_panel_layout.minimum) {
        output.destroy();

        return `\n${wrapAnsi(`${params.title}\n${params.message}`, width, {hard: true, trim: false, wordWrap: true})}\n`;
    }

    // Clack의 긴 제목 생략 대신 본문으로 이동해 질문 원문 보존
    const fits = stringWidth(params.title) <= width - init_panel_layout.titleInset;
    const title = fits ? params.title : init_defaults.emptyText;
    const message = fits ? params.message : `${params.title}\n\n${params.message}`;
    // Clack의 짝수 폭과 맞춰 결합 문자를 끊지 않는 줄바꿈을 먼저 적용
    const inner = Math.floor(width / init_panel_layout.even) * init_panel_layout.even - init_panel_layout.contentInset;
    box(`\n${wrapAnsi(message, inner, {hard: true, trim: false, wordWrap: true})}\n`, title, {
        output,
        width: 1,
        titleAlign: "center",
        rounded: true,
        withGuide: false,
        formatBorder: getColor(params.color ?? init_panel_color),
    });
    output.destroy();

    return `\n${chunks.join("")}`;
};

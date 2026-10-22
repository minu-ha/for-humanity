import type {TextPrompt} from "@clack/core";
import {colors} from "consola/utils";
import {init_input_segments} from "@/entry/init/_constant/init";

/**
 * Clack이 관리하는 입력과 UTF-16 커서 위치
 */
type InitInputCursor = Pick<TextPrompt, "userInput" | "cursor">;

/**
 * 한글 결합 문자와 이모지를 분리하지 않는 입력 커서
 */
export const toInitInput = (prompt: InitInputCursor): string => {
    for (const part of init_input_segments.segment(prompt.userInput)) {
        if (prompt.cursor < part.index + part.segment.length) {
            return `${prompt.userInput.slice(0, part.index)}${colors.inverse(part.segment)}${prompt.userInput.slice(part.index + part.segment.length)}`;
        }
    }

    return `${prompt.userInput}█`;
};

import {getColumns, TextPrompt} from "@clack/core";
import {colors} from "consola/utils";
import {init_cancelled, init_copy, init_defaults, init_prompt_defaults} from "@/entry/init/_constant/init";
import {toInitInput} from "@/entry/init/_function/to-init-input";
import {toInitPanel} from "@/entry/init/_function/to-init-panel";
import type {InitPromptParams, InitPromptSelection} from "@/entry/init/_type/init-prompt";

/**
 * 추천값 선택과 직접 입력을 같은 박스 안에서 수집하는 경계
 */
export const promptInitChoice = async <T>(params: InitPromptParams<T>): Promise<T> => {
    const custom = params.custom ?? init_prompt_defaults.custom;
    const count = params.presets.length + Number(custom);
    const output = params.output ?? process.stdout;
    const selection: InitPromptSelection = {index: 0, input: init_defaults.emptyText};

    if (count === 0) {
        throw new Error("A selection question needs at least one option.");
    }

    const prompt: TextPrompt = new TextPrompt({
        input: params.input,
        output,
        signal: params.signal,
        defaultValue: init_defaults.emptyText,
        validate: (input) => {
            const value = selection.index === params.presets.length ? input : params.presets[selection.index].value;
            const checked = params.schema.safeParse(value);

            return checked.success ? undefined : checked.error.issues.map((issue) => issue.message).join("\n");
        },
        render: () => {
            const panel = {title: params.message, columns: getColumns(output)};

            if (prompt.state === "cancel") {
                return toInitPanel({...panel, message: init_copy.cancelledPrompt, color: "gray"});
            }

            if (prompt.state === "submit") {
                const value = selection.index === params.presets.length ? prompt.userInput.trim() : params.presets[selection.index].label;

                return toInitPanel({...panel, message: colors.bold(value || init_copy.notSet), color: "green"});
            }

            const rows = params.presets.map((preset, index) => {
                if (index !== selection.index) {
                    return colors.dim(`○ ${preset.label}`);
                }

                const hint = preset.hint === undefined ? init_defaults.emptyText : colors.dim(`  ${preset.hint}`);

                return `${colors.cyan("●")} ${colors.bold(preset.label)}${hint}`;
            });

            if (custom) {
                const active = selection.index === params.presets.length;
                const placeholder = params.placeholder ?? init_copy.customHint;
                const input = prompt.userInput === "" ? colors.dim(placeholder) : toInitInput(prompt);
                const label = params.presets.length === 0 ? init_defaults.emptyText : `${init_copy.custom}  `;
                rows.push(active ? `${colors.cyan("●")} ${label}${input}` : colors.dim(`○ ${label}${prompt.userInput}`));
            }

            const keys = custom ? init_copy.inputKeys : init_copy.selectKeys;
            const hint = params.presets.length === 0 ? init_copy.textKeys : keys;
            const error = prompt.state === "error" ? [colors.yellow(prompt.error), ""] : [];

            return toInitPanel({
                ...panel,
                message: [...rows, "", ...error, colors.dim(hint), colors.dim(init_copy.cancelKey)].join("\n"),
                color: prompt.state === "error" ? "yellow" : undefined,
            });
        },
    });

    prompt.on("userInput", (input) => {
        if (custom && input !== selection.input) {
            selection.index = params.presets.length;
        }

        selection.input = input;
    });
    prompt.on("cursor", (key) => {
        if (key === "up") {
            selection.index = (selection.index + count - 1) % count;
        } else if (key === "down") {
            selection.index = (selection.index + 1) % count;
        }
    });
    prompt.on("key", (key) => {
        if (custom && key === "\t") {
            selection.index = params.presets.length;
        }
    });

    const answer = await prompt.prompt();

    if (typeof answer === "symbol") {
        throw init_cancelled;
    }

    return params.schema.parse(selection.index === params.presets.length ? answer : params.presets[selection.index].value);
};

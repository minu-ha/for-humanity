import {PassThrough} from "node:stream";
import {stripAnsi} from "consola/utils";
import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";
import {z} from "zod";
import {init_cancelled} from "@/entry/init/_constant/init";
import {promptInitChoice} from "@/entry/init/_function/prompt-init-choice";
import {initTitleSchema, initUrlSchema} from "@/entry/init/_type/init-input";

const controllers: AbortController[] = [];

/**
 * 실제 readline 입력과 렌더링을 받는 독립 터미널
 */
const createTerminal = () => {
    const input = new PassThrough();
    const output = Object.assign(new PassThrough(), {columns: 64, rows: 40});
    const controller = new AbortController();
    const frames: string[] = [];
    output.on("data", (chunk: Buffer) => frames.push(chunk.toString()));
    controllers.push(controller);

    return {input, output, signal: controller.signal, frames};
};

const question = {
    message: "Site title",
    placeholder: "Team handbook",
    presets: [{value: "Project notes", label: "Project notes"}],
    schema: initTitleSchema,
};

beforeEach(() => {
    // TERM=dumb에서는 Node readline이 방향키와 삭제를 편집으로 처리하지 않음
    vi.stubEnv("TERM", "xterm-256color");
});

afterEach(() => {
    for (const controller of controllers.splice(0)) {
        controller.abort();
    }
    vi.unstubAllEnvs();
});

describe("박스 안에서 선택과 직접 입력", () => {
    test("추천값에서 바로 타이핑하고 Enter 한 번으로 확정한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        const checked = expect(result).resolves.toBe("우리 팀 문서");
        terminal.input.write("우리 팀 문서\r");
        await checked;

        const output = stripAnsi(terminal.frames.join(""));
        expect(output).toContain("╭");
        expect(output).toContain("Custom");
        expect(output).not.toContain("Custom...");
        expect(output).not.toContain("✔");
    });

    test("Custom 행으로 이동하면 추가 Enter 없이 입력한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        const checked = expect(result).resolves.toBe("Handbook");
        terminal.input.write("\u001b[BHandbook\r");
        await checked;
    });

    test("위아래 방향키로 추천값을 선택한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({
            ...question,
            presets: [
                {value: "content", label: "content"},
                {value: "docs", label: "docs"},
            ],
            ...terminal,
        });
        const checked = expect(result).resolves.toBe("docs");
        terminal.input.write("\u001b[B\r");
        await checked;
    });

    test("직접 입력하다 추천값으로 돌아가면 추천값을 사용한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        const checked = expect(result).resolves.toBe("Project notes");
        terminal.input.write("Draft\u001b[A\r");
        await checked;
    });

    test("추천값을 거쳐 Custom으로 돌아오면 입력을 보존한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        const checked = expect(result).resolves.toBe("Draft");
        terminal.input.write("Draft\u001b[A\u001b[B\r");
        await checked;
    });

    test("좌우 방향키와 삭제는 직접 입력한 문자를 편집한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        const checked = expect(result).resolves.toBe("Guide");
        terminal.input.write("Guixe\u001b[D\u007fd\r");
        await checked;
    });

    test("색상 커서가 이모지의 UTF-16 문자를 분리하지 않는다", async () => {
        vi.stubEnv("FORCE_COLOR", "1");
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        const checked = expect(result).resolves.toBe("😀X");
        terminal.input.write("😀X\u001b[D\u001b[D\r");
        await checked;

        expect(terminal.frames.join("")).not.toContain("�");
    });

    test("잘못된 값은 같은 질문에서 고친 뒤 확정한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        result.catch(() => {});
        terminal.input.write("\u001b[B\r");
        expect(stripAnsi(terminal.frames.join(""))).toContain("Enter a site title.");
        terminal.input.write("Guide\r");
        await expect(result).resolves.toBe("Guide");
    });

    test("Ctrl+C는 취소로 전달한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...question, ...terminal});
        const checked = expect(result).rejects.toBe(init_cancelled);
        terminal.input.write("Draft\u0003");
        await checked;
    });

    test("고정 선택 질문에는 직접 입력 항목이 없다", async () => {
        const terminal = createTerminal();
        const params = {
            ...question,
            ...terminal,
            custom: false,
            presets: [
                {value: "none", label: "Set up later"},
                {value: "github-pages", label: "GitHub Pages"},
            ],
        };
        const result = promptInitChoice(params);
        const checked = expect(result).resolves.toBe("github-pages");
        terminal.input.write("\u001b[B\r");
        await checked;
        expect(stripAnsi(terminal.frames.join(""))).not.toContain("Custom");
    });

    test("false와 undefined도 유효한 선택값으로 전달한다", async () => {
        const terminal = createTerminal();
        const result = promptInitChoice({...terminal, message: "Create these files?", custom: false, presets: [{value: false, label: "No"}], schema: z.boolean()});
        const checked = expect(result).resolves.toBe(false);
        terminal.input.write("\r");
        await checked;

        const next = createTerminal();
        const url = promptInitChoice({...next, message: "Public site origin", presets: [{value: undefined, label: "Set up later"}], schema: initUrlSchema});
        const urlChecked = expect(url).resolves.toBeUndefined();
        next.input.write("\r");
        await urlChecked;
    });
});

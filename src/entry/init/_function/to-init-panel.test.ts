import {stripAnsi} from "consola/utils";
import stringWidth from "string-width";
import {describe, expect, test} from "vitest";
import {toInitPanel} from "@/entry/init/_function/to-init-panel";

describe("터미널 폭에 맞춘 Clack 박스", () => {
    test.each([80, 64, 44, 31, 12])("%i열에서 한글과 긴 경로를 화면 안에 보존한다", (columns) => {
        const title = "우리 팀의 문서 사이트 이름";
        const message = `한글 문서 안내\n${"long-directory/".repeat(12)}`;
        const output = stripAnsi(toInitPanel({title, message, columns}));

        for (const line of output.trim().split("\n")) {
            expect(stringWidth(line)).toBeLessThanOrEqual(Math.min(columns, 64));
        }

        const content = output.replace(/[╭╮╰╯│─\s]/g, "");
        expect(content).toContain(title.replaceAll(" ", ""));
        expect(content).toContain(message.replace(/\s/g, ""));
        expect(output).not.toContain("...");
    });

    test("박스를 표시할 수 없는 폭에서는 원문을 줄바꿈한다", () => {
        const output = toInitPanel({title: "Title", message: "Some answer", columns: 8});

        expect(output).not.toContain("╭");
        expect(output.replace(/\s/g, "")).toBe("TitleSomeanswer");
    });

    test("좁은 박스에서도 이모지 결합 문자를 한 덩어리로 유지한다", () => {
        const emoji = "👨‍👩‍👧‍👦";
        const output = stripAnsi(toInitPanel({title: "Emoji", message: emoji.repeat(20), columns: 31}));
        const content = output.split("\n").filter((line) => line.includes("👨"));

        for (const line of content) {
            expect(line.replaceAll(emoji, "").replace(/[│\s]/g, "")).toBe("");
        }
        expect(content.join("").match(/👨‍👩‍👧‍👦/g)).toHaveLength(20);
    });
});

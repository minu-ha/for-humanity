import {describe, expect, test, vi} from "vitest";
import {init_cancelled} from "@/entry/init/_constant/init";
import type {InitProject} from "@/entry/init/_function/read-init-project";
import {toInitOptions} from "@/entry/init/_function/to-init-options";
import type {InitInput} from "@/entry/init/_type/init-input";
import {logger} from "@/util/logger/logger";

/**
 * 선택 질문에 필요한 프로젝트 후보
 */
const project: InitProject = {
    root: "/project",
    kitRoot: "/kit",
    version: "0.17.0",
    manifest: {name: "team-notes"},
    packageFile: undefined,
    manager: "npm",
    packageManager: undefined,
    repository: undefined,
    branch: "main",
};

/**
 * 필드 하나의 질문만 열기 위한 명시적 인자
 */
const args: InitInput = {
    // biome-ignore lint/style/useNamingConvention: Citty의 위치 인자 계약
    _: [],
    dir: ".",
    yes: false,
    title: "Guide",
    content: "content",
    lang: "ko",
    deploy: "none",
    branch: "main",
};

describe("초기화 추천값과 직접 입력", () => {
    test("사이트 이름의 추천값은 텍스트 입력 없이 선택한다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-0");

        const result = await toInitOptions({args: {...args, title: undefined}, project, interactive: true});

        expect(result.title).toBe("team-notes");
        expect(prompt).toHaveBeenCalledExactlyOnceWith("Site title", expect.objectContaining({type: "select", cancel: "symbol"}));
    });

    test.each(["", "   ", "team\nnotes"])("기존 프로젝트 이름 %j은 기본 사이트 이름으로 제안한다", async (name) => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-0");

        const result = await toInitOptions({args: {...args, title: undefined}, project: {...project, manifest: {name}}, interactive: true});

        expect(result.title).toBe("Project notes");
        expect(prompt).toHaveBeenCalledExactlyOnceWith(
            "Site title",
            expect.objectContaining({options: expect.arrayContaining([expect.objectContaining({label: "Project notes"})])}),
        );
    });

    test("비대화형 실행도 비어 있는 프로젝트 이름 대신 기본 제목을 사용한다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected prompt"));

        const result = await toInitOptions({args: {...args, title: undefined}, project: {...project, manifest: {name: ""}}, interactive: false});

        expect(result.title).toBe("Project notes");
        expect(prompt).not.toHaveBeenCalled();
    });

    test("문서 폴더는 docs 추천값을 선택할 수 있다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-1");

        const result = await toInitOptions({args: {...args, content: undefined}, project, interactive: true});

        expect(result.content).toBe("docs");
        expect(prompt).toHaveBeenCalledWith("Documentation folder", expect.objectContaining({type: "select"}));
    });

    test("문서 언어는 English 추천값을 선택할 수 있다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-1");

        const result = await toInitOptions({args: {...args, lang: undefined}, project, interactive: true});

        expect(result.lang).toBe("en");
        expect(prompt).toHaveBeenCalledWith("Document language", expect.objectContaining({type: "select"}));
    });

    test("직접 입력을 선택하면 사이트 이름을 따로 묻는다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("custom").mockResolvedValueOnce("Team handbook");

        const result = await toInitOptions({args: {...args, title: undefined}, project, interactive: true});

        expect(result.title).toBe("Team handbook");
        expect(prompt).toHaveBeenNthCalledWith(2, "Site title", expect.objectContaining({type: "text", cancel: "symbol"}));
    });

    test("직접 입력한 폴더가 잘못되면 입력만 다시 묻는다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
        prompt.mockResolvedValueOnce("custom").mockResolvedValueOnce("../outside").mockResolvedValueOnce("handbook");

        const result = await toInitOptions({args: {...args, content: undefined}, project, interactive: true});

        expect(result.content).toBe("handbook");
        expect(prompt).toHaveBeenCalledTimes(3);
        expect(warn).toHaveBeenCalledOnce();
    });

    test("감지한 저장소는 추천값으로 선택한다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-0");

        const result = await toInitOptions({
            args: {...args, deploy: "github-pages", url: "https://docs.example.org"},
            project: {...project, repository: "example/notes"},
            interactive: true,
        });

        expect(result.repository).toBe("example/notes");
        expect(prompt).toHaveBeenCalledWith("GitHub repository (owner/name)", expect.objectContaining({type: "select"}));
    });

    test("감지한 저장소가 없으면 바로 직접 입력한다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("example/notes");

        const result = await toInitOptions({args: {...args, deploy: "github-pages", url: "https://docs.example.org"}, project, interactive: true});

        expect(result.repository).toBe("example/notes");
        expect(prompt).toHaveBeenCalledWith("GitHub repository (owner/name)", expect.objectContaining({type: "text"}));
    });

    test("감지한 master 외에 main 브랜치를 선택할 수 있다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-1");

        const result = await toInitOptions({
            args: {...args, branch: undefined, deploy: "github-pages", repository: "example/notes", url: "https://docs.example.org"},
            project: {...project, branch: "master"},
            interactive: true,
        });

        expect(result.branch).toBe("main");
        expect(prompt).toHaveBeenCalledWith("Deployment branch", expect.objectContaining({type: "select"}));
    });

    test("공개 주소는 나중에 설정을 선택할 수 있다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-0");

        const result = await toInitOptions({args: {...args, deploy: "cloudflare-pages"}, project, interactive: true});

        expect(result.url).toBeUndefined();
        expect(prompt).toHaveBeenCalledWith("Public site origin (optional)", expect.objectContaining({type: "select"}));
    });

    test("추천값의 이름이 custom이어도 직접 입력과 혼동하지 않는다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("preset-0");

        const result = await toInitOptions({args: {...args, title: undefined}, project: {...project, manifest: {name: "custom"}}, interactive: true});

        expect(result.title).toBe("custom");
        expect(prompt).toHaveBeenCalledOnce();
    });

    test("직접 입력 중 취소하면 초기화 취소를 그대로 전달한다", async () => {
        // 제네릭 spy 타입에서 생략되는 Consola의 cancel: symbol 반환값
        const prompt = vi.fn().mockRejectedValue(new Error("Unexpected extra prompt"));
        prompt.mockResolvedValueOnce("custom").mockResolvedValueOnce(Symbol.for("cancel"));
        vi.spyOn(logger, "prompt").mockImplementation(prompt);

        await expect(toInitOptions({args: {...args, title: undefined}, project, interactive: true})).rejects.toBe(init_cancelled);
    });

    test("비대화형 실행과 명시한 값에는 질문을 추가하지 않는다", async () => {
        const prompt = vi.spyOn(logger, "prompt").mockRejectedValue(new Error("Unexpected prompt"));

        const result = await toInitOptions({args, project, interactive: false});

        expect(result).toMatchObject({title: "Guide", content: "content", lang: "ko", deploy: "none"});
        expect(prompt).not.toHaveBeenCalled();
    });
});

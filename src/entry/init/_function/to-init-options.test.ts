import {beforeEach, describe, expect, test, vi} from "vitest";
import {init_cancelled} from "@/entry/init/_constant/init";
import {promptInitChoice} from "@/entry/init/_function/prompt-init-choice";
import type {InitProject} from "@/entry/init/_function/read-init-project";
import {toInitOptions} from "@/entry/init/_function/to-init-options";
import type {InitInput} from "@/entry/init/_type/init-input";

vi.mock("@/entry/init/_function/prompt-init-choice", () => ({promptInitChoice: vi.fn()}));

const prompt = vi.mocked(promptInitChoice);

beforeEach(() => {
    prompt.mockReset().mockRejectedValue(new Error("Unexpected extra prompt"));
});

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
        prompt.mockResolvedValueOnce("team-notes");

        const result = await toInitOptions({args: {...args, title: undefined}, project, interactive: true});

        expect(result.title).toBe("team-notes");
        expect(prompt).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({message: "Site title", presets: [{value: "team-notes", label: "team-notes", hint: "Recommended"}]}),
        );
    });

    test.each(["", "   ", "team\nnotes"])("기존 프로젝트 이름 %j은 기본 사이트 이름으로 제안한다", async (name) => {
        prompt.mockResolvedValueOnce("Project notes");

        const result = await toInitOptions({args: {...args, title: undefined}, project: {...project, manifest: {name}}, interactive: true});

        expect(result.title).toBe("Project notes");
        expect(prompt).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({message: "Site title", presets: expect.arrayContaining([expect.objectContaining({label: "Project notes"})])}),
        );
    });

    test("비대화형 실행도 비어 있는 프로젝트 이름 대신 기본 제목을 사용한다", async () => {
        const result = await toInitOptions({args: {...args, title: undefined}, project: {...project, manifest: {name: ""}}, interactive: false});

        expect(result.title).toBe("Project notes");
        expect(prompt).not.toHaveBeenCalled();
    });

    test("문서 폴더는 docs 추천값을 선택할 수 있다", async () => {
        prompt.mockResolvedValueOnce("docs");

        const result = await toInitOptions({args: {...args, content: undefined}, project, interactive: true});

        expect(result.content).toBe("docs");
        expect(prompt).toHaveBeenCalledWith(expect.objectContaining({message: "Documentation folder"}));
    });

    test("문서 언어는 English 추천값을 선택할 수 있다", async () => {
        prompt.mockResolvedValueOnce("en");

        const result = await toInitOptions({args: {...args, lang: undefined}, project, interactive: true});

        expect(result.lang).toBe("en");
        expect(prompt).toHaveBeenCalledWith(expect.objectContaining({message: "Document language"}));
    });

    test("직접 입력한 사이트 이름을 추가 질문 없이 사용한다", async () => {
        prompt.mockResolvedValueOnce("Team handbook");

        const result = await toInitOptions({args: {...args, title: undefined}, project, interactive: true});

        expect(result.title).toBe("Team handbook");
        expect(prompt).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({message: "Site title"}));
    });

    test("호스팅은 고정 선택만 허용한다", async () => {
        prompt.mockResolvedValueOnce("none");

        const result = await toInitOptions({args: {...args, deploy: undefined}, project, interactive: true});

        expect(result.deploy).toBe("none");
        expect(prompt).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({message: "Where will you publish your site?", custom: false}));
    });

    test("감지한 저장소는 추천값으로 선택한다", async () => {
        prompt.mockResolvedValueOnce("example/notes");

        const result = await toInitOptions({
            args: {...args, deploy: "github-pages", url: "https://docs.example.org"},
            project: {...project, repository: "example/notes"},
            interactive: true,
        });

        expect(result.repository).toBe("example/notes");
        expect(prompt).toHaveBeenCalledWith(expect.objectContaining({message: "GitHub repository (owner/name)"}));
    });

    test("감지한 저장소가 없으면 바로 직접 입력한다", async () => {
        prompt.mockResolvedValueOnce("example/notes");

        const result = await toInitOptions({args: {...args, deploy: "github-pages", url: "https://docs.example.org"}, project, interactive: true});

        expect(result.repository).toBe("example/notes");
        expect(prompt).toHaveBeenCalledWith(expect.objectContaining({message: "GitHub repository (owner/name)", presets: []}));
    });

    test("감지한 master 외에 main 브랜치를 선택할 수 있다", async () => {
        prompt.mockResolvedValueOnce("main");

        const result = await toInitOptions({
            args: {...args, branch: undefined, deploy: "github-pages", repository: "example/notes", url: "https://docs.example.org"},
            project: {...project, branch: "master"},
            interactive: true,
        });

        expect(result.branch).toBe("main");
        expect(prompt).toHaveBeenCalledWith(expect.objectContaining({message: "Deployment branch"}));
    });

    test("공개 주소는 나중에 설정을 선택할 수 있다", async () => {
        prompt.mockResolvedValueOnce(undefined);

        const result = await toInitOptions({args: {...args, deploy: "cloudflare-pages"}, project, interactive: true});

        expect(result.url).toBeUndefined();
        expect(prompt).toHaveBeenCalledWith(expect.objectContaining({message: "Public site origin (optional)"}));
    });

    test("추천값의 이름이 custom이어도 직접 입력과 혼동하지 않는다", async () => {
        prompt.mockResolvedValueOnce("custom");

        const result = await toInitOptions({args: {...args, title: undefined}, project: {...project, manifest: {name: "custom"}}, interactive: true});

        expect(result.title).toBe("custom");
        expect(prompt).toHaveBeenCalledOnce();
    });

    test("직접 입력 중 취소하면 초기화 취소를 그대로 전달한다", async () => {
        prompt.mockRejectedValueOnce(init_cancelled);

        await expect(toInitOptions({args: {...args, title: undefined}, project, interactive: true})).rejects.toBe(init_cancelled);
    });

    test("비대화형 실행과 명시한 값에는 질문을 추가하지 않는다", async () => {
        const result = await toInitOptions({args, project, interactive: false});

        expect(result).toMatchObject({title: "Guide", content: "content", lang: "ko", deploy: "none"});
        expect(prompt).not.toHaveBeenCalled();
    });
});

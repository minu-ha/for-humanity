import {promises as fileSystem} from "node:fs";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect, vi} from "vitest";
import {applyInitPlan} from "@/entry/init/_function/apply-init-plan";
import {readInitProject} from "@/entry/init/_function/read-init-project";
import {toInitPlan} from "@/entry/init/_function/to-init-plan";
import {logger} from "@/util/logger/logger";

describe("초기화 파일 적용", () => {
    test("[INIT-013] 확인 중 바뀐 파일이 있으면 쓰기 전에 중단한다", async ({root}) => {
        await fileSystem.writeFile(join(root, "package.json"), '{"private":true}');
        const project = await readInitProject({root, manager: "npm"});
        const plan = await toInitPlan({project, options: {title: "Guide", content: "content", lang: "en", deploy: "none", branch: "main", manager: "npm"}});
        await fileSystem.writeFile(join(root, "package.json"), '{"private":true,"edited":true}');

        await expect(applyInitPlan(plan)).rejects.toThrow("File changed during init: package.json");
        expect(await fileSystem.readFile(join(root, "package.json"), "utf8")).toBe('{"private":true,"edited":true}');
        expect(await fileSystem.readdir(root)).toEqual(["package.json"]);
    });

    test("[INIT-014] 마지막 파일 쓰기가 실패하면 기존 파일의 바이트와 빈 폴더를 복원한다", async ({root}) => {
        const original = '{\r\n\t"name": "existing"\r\n}\r\n';
        await fileSystem.writeFile(join(root, "package.json"), original);
        await fileSystem.writeFile(join(root, ".gitignore"), "# Keep\r\n");
        await fileSystem.mkdir(join(root, "content"));
        const project = await readInitProject({root, manager: "npm"});
        const plan = await toInitPlan({project, options: {title: "Guide", content: "content", lang: "en", deploy: "none", branch: "main", manager: "npm"}});
        const rename = fileSystem.rename;
        vi.spyOn(fileSystem, "rename").mockImplementation(async (source, target) => {
            if (target === join(root, ".gitignore")) {
                throw new Error("simulated disk failure");
            }

            await rename(source, target);
        });

        await expect(applyInitPlan(plan)).rejects.toThrow("simulated disk failure");
        expect(await fileSystem.readFile(join(root, "package.json"), "utf8")).toBe(original);
        expect(await fileSystem.readFile(join(root, ".gitignore"), "utf8")).toBe("# Keep\r\n");
        expect(await fileSystem.readdir(join(root, "content"))).toEqual([]);
        expect(await fileSystem.readdir(root)).toEqual([".gitignore", "content", "package.json"]);
    });

    test("[INIT-015] 새 프로젝트의 쓰기 실패는 이번에 만든 폴더까지 되돌린다", async ({root}) => {
        const target = join(root, "new-project");
        const project = await readInitProject({root: target, manager: "npm"});
        const plan = await toInitPlan({project, options: {title: "Guide", content: "content", lang: "en", deploy: "none", branch: "main", manager: "npm"}});
        const link = fileSystem.link;
        vi.spyOn(fileSystem, "link").mockImplementation(async (source, destination) => {
            if (destination === join(target, "package.json")) {
                throw new Error("simulated disk failure");
            }

            await link(source, destination);
        });

        await expect(applyInitPlan(plan)).rejects.toThrow("simulated disk failure");
        expect(await fileSystem.readdir(root)).toEqual([]);
    });

    test("[INIT-016] 복구 중 다른 작업의 편집을 보존하고 경로를 알린다", async ({root}) => {
        await fileSystem.writeFile(join(root, ".gitignore"), "# Keep\n");
        const project = await readInitProject({root, manager: "npm"});
        const plan = await toInitPlan({project, options: {title: "Guide", content: "content", lang: "en", deploy: "none", branch: "main", manager: "npm"}});
        const rename = fileSystem.rename;
        const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
        vi.spyOn(fileSystem, "rename").mockImplementation(async (source, target) => {
            if (target === join(root, ".gitignore")) {
                await fileSystem.writeFile(join(root, "for-humanity.config.ts"), "USER_EDIT");
                throw new Error("simulated disk failure");
            }

            await rename(source, target);
        });

        await expect(applyInitPlan(plan)).rejects.toThrow("simulated disk failure");
        expect(await fileSystem.readFile(join(root, "for-humanity.config.ts"), "utf8")).toBe("USER_EDIT");
        expect(await fileSystem.readdir(root)).toEqual([".gitignore", "for-humanity.config.ts"]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("for-humanity.config.ts"));
    });
});

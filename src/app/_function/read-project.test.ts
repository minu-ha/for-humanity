import {mkdir, symlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {readProject} from "@/app/_function/read-project";

describe("프로젝트 문서 루트", () => {
    for (const directory of ["dist", ".git", "node_modules"]) {
        test(`${directory}를 가리키는 문서 루트 별칭은 거부한다`, async ({root}) => {
            /**
             * GIVEN
             * 예약 폴더 아래 문서를 가리키는 symlink
             */
            await mkdir(join(root, directory, "notes"), {recursive: true});
            await symlink(join(root, directory, "notes"), join(root, "notes"), "junction");
            await writeFile(join(root, "for-humanity.config.mjs"), 'export default {content: {root: "notes"}};');

            /**
             * WHEN / THEN
             * 실제 경로의 예약 폴더 검사
             */
            await expect(readProject(root)).rejects.toThrow("content");
        });
    }
});

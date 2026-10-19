import {execFileSync} from "node:child_process";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";

describe("사이트 설정", () => {
    test("TypeScript 설정의 제목과 탐색 순서가 빌드에 반영된다", async ({root}) => {
        /**
         * GIVEN
         * 이름순과 반대인 탐색 설정과 두 묶음의 문서
         */
        await mkdir(join(root, "content/public"), {recursive: true});
        await writeFile(join(root, "content/README.md"), "# Home\n");
        await writeFile(
            join(root, "for-humanity.config.ts"),
            'import type {SiteConfig} from "for-humanity";\nexport default {title: "Typed site", navigation: ["Z group", "A group"]} satisfies SiteConfig;\n',
        );
        await writeFile(join(root, "content/public/alpha.md"), "---\nname: Alpha\nlabel: Alpha\ngroup: A group\n---\n\nFirst alphabetically.\n");
        await writeFile(join(root, "content/public/zeta.md"), "---\nname: Zeta\nlabel: Zeta\ngroup: Z group\n---\n\nFirst by configuration.\n");

        /**
         * WHEN
         * 실제 CLI의 정적 사이트 빌드
         */
        execFileSync(process.execPath, ["dist/cli.js", "build", root]);
        const result = await readFile(join(root, "content/dist/index.html"), "utf8");

        /**
         * THEN
         * 사이트 이름과 지정한 묶음 순서 적용
         */
        expect(result).toContain("Typed site");
        expect([...result.matchAll(/<section\b[^>]*aria-label="([^"]+)"/g)].map((match) => match[1])).toStrictEqual(["Z group", "A group"]);
    });
});

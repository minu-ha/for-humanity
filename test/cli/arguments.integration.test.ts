import {spawnSync} from "node:child_process";
import {readFile, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {z} from "zod/mini";

describe("CLI 인자와 출력", () => {
    test("도움말과 버전은 설정을 실행하거나 사이트를 빌드하지 않는다", async ({root}) => {
        /**
         * GIVEN
         * 실행하면 실패하는 소비자 설정
         */
        await writeFile(join(root, "for-humanity.config.ts"), 'throw new Error("CONFIG_MUST_NOT_RUN");');
        const cli = resolve("dist/cli.js");
        const manifest = z.object({version: z.string()}).parse(JSON.parse(await readFile("package.json", "utf8")));

        /**
         * WHEN / THEN
         * 루트·명령별 도움말과 실제 패키지 버전의 독립 실행
         */
        for (const args of [["--help"], ["-h"], ["dev", "--help"], ["build", "--help"], ["preview", "--help"]]) {
            const result = spawnSync(process.execPath, [cli, ...args], {cwd: root, encoding: "utf8", timeout: 5000});
            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout).toContain("USAGE");
            expect(result.stdout).toContain(args.length === 1 ? "COMMANDS" : "[DIR]");
            expect(result.stderr).toBe("");
        }
        for (const flag of ["--version", "-v"]) {
            const result = spawnSync(process.execPath, [cli, flag], {cwd: root, encoding: "utf8", timeout: 5000});
            expect(result.status, result.stderr).toBe(0);
            expect(result.stdout.trim()).toBe(manifest.version);
        }
    });

    test("잘못된 명령·옵션·초과 인자는 빌드 전에 실패한다", async ({root}) => {
        /**
         * GIVEN
         * 인자 검증 뒤에만 읽을 설정
         */
        await writeFile(join(root, "for-humanity.config.ts"), 'throw new Error("CONFIG_MUST_NOT_RUN");');
        const cli = resolve("dist/cli.js");

        /**
         * WHEN / THEN
         * 잘못된 입력의 종료 코드와 설정 미실행
         */
        for (const args of [["unknown"], ["build", "--unknown"], ["--unknown", "build"], ["build", ".", "extra"]]) {
            const result = spawnSync(process.execPath, [cli, ...args], {cwd: root, encoding: "utf8", timeout: 5000});
            expect(result.status, JSON.stringify(args)).toBe(1);
            expect(result.stderr).not.toContain("CONFIG_MUST_NOT_RUN");
            expect(result.stderr).not.toBe("");
        }
    });

    test("폴더를 생략한 빌드는 현재 폴더를 사용하고 경고 뒤에도 성공한다", {timeout: 45000}, async ({root}) => {
        /**
         * GIVEN
         * 없는 문서 링크를 포함한 홈
         */
        await writeFile(join(root, "README.md"), "# Local home\n\n[Missing](missing.md)\n");

        /**
         * WHEN
         * 문서 폴더 인자 없는 빌드
         */
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "build"], {
            cwd: root,
            encoding: "utf8",
            timeout: 30000,
            env: {
                ...process.env,

                // biome-ignore lint/style/useNamingConvention: Consola가 정의한 외부 환경 변수 이름
                CONSOLA_LEVEL: "3",
            },
        });

        /**
         * THEN
         * 표준 출력의 성공 로그와 표준 오류의 파일 위치 경고
         */
        expect(result.error).toBeUndefined();
        expect(result.status, result.stderr).toBe(0);
        expect(result.stdout).toContain("for-humanity");
        expect(result.stdout).toContain("files,");
        expect(result.stderr).toContain("README.md:3");
        expect(result.stderr).toContain("missing.md");
        expect(await readFile(join(root, "dist/index.html"), "utf8")).toContain("Local home");
    });
});

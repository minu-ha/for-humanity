import {spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {createServer} from "node:net";
import {join, resolve} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {z} from "zod/mini";

/**
 * CLI 명령의 입력 검사와 빌드 출력(src/entry/cli) 검증
 */
describe("CLI 명령", () => {
    describe("도움말과 입력 검사", () => {
        test("[CMD-001] 도움말과 버전은 설정을 실행하거나 사이트를 빌드하지 않는다", async ({root}) => {
            /**
             * GIVEN
             * 실행하면 실패하는 소비자 설정
             */
            await writeFile(join(root, "for-humanity.config.ts"), 'throw new Error("CONFIG_MUST_NOT_RUN");');

            const cli = resolve("dist/cli.js");
            const manifest = z.object({version: z.string()}).parse(JSON.parse(await readFile("package.json", "utf8")));

            /**
             * WHEN
             * 루트와 명령별 도움말, 버전 플래그의 독립 실행
             */
            const helps = [["--help"], ["-h"], ["dev", "--help"], ["build", "--help"], ["preview", "--help"]].map((args) => {
                return {args, result: spawnSync(process.execPath, [cli, ...args], {cwd: root, encoding: "utf8", timeout: 5000})};
            });

            const versions = ["--version", "-v"].map((flag) => spawnSync(process.execPath, [cli, flag], {cwd: root, encoding: "utf8", timeout: 5000}));

            /**
             * THEN
             * 설정 실행 없는 사용법 안내와 실제 패키지 버전
             */
            for (const help of helps) {
                expect(help.result.status, help.result.stderr).toBe(0);
                expect(help.result.stdout).toContain("USAGE");
                expect(help.result.stdout).toContain(help.args.length === 1 ? "COMMANDS" : "[DIR]");
                expect(help.result.stderr).toBe("");

                if (help.args[0] === "dev" || help.args[0] === "preview") {
                    expect(help.result.stdout).toContain("--host");
                } else if (help.args[0] === "build") {
                    expect(help.result.stdout).not.toContain("--host");
                }
            }

            for (const version of versions) {
                expect(version.status, version.stderr).toBe(0);
                expect(version.stdout.trim()).toBe(manifest.version);
            }
        });

        test("[CMD-002] 잘못된 명령, 옵션, 초과 인자는 빌드 전에 실패한다", async ({root}) => {
            /**
             * GIVEN
             * 인자 검증 뒤에만 읽을 설정
             */
            await writeFile(join(root, "for-humanity.config.ts"), 'throw new Error("CONFIG_MUST_NOT_RUN");');

            const cli = resolve("dist/cli.js");

            /**
             * WHEN
             * 잘못된 명령, 옵션, 초과 인자의 CLI 실행
             */
            const runs = [
                ["unknown"],
                ["build", "--unknown"],
                ["--unknown", "build"],
                ["build", ".", "extra"],
                ["build", "--host"],
                ["dev", "--no-host"],
                ["preview", "--host", "http://localhost"],
            ].map((args) => {
                return {args, result: spawnSync(process.execPath, [cli, ...args], {cwd: root, encoding: "utf8", timeout: 5000})};
            });

            /**
             * THEN
             * 잘못된 입력의 종료 코드와 설정 미실행
             */
            for (const run of runs) {
                expect(run.result.status, JSON.stringify(run.args)).toBe(1);
                expect(run.result.stderr).not.toContain("CONFIG_MUST_NOT_RUN");
                expect(run.result.stderr).not.toBe("");
            }
        });
    });

    describe("빌드", () => {
        test("[CMD-003] 폴더를 생략한 빌드는 현재 프로젝트의 content를 사용하고 경고 뒤에도 성공한다", {timeout: 45000}, async ({root}) => {
            /**
             * GIVEN
             * 없는 문서 링크를 포함한 홈
             */
            await mkdir(join(root, "content/public"), {recursive: true});
            await writeFile(join(root, "content/README.md"), "# Local home\n\n[Missing](public/missing.md)\n");

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
            expect(await readFile(join(root, "content/dist/index.html"), "utf8")).toContain("Local home");
        });
    });

    describe("서버 수신 주소", () => {
        test.for([
            {caseId: "CMD-004", name: "dev의 명시적 CLI 주소", command: "dev", args: ["--host", "127.0.0.1"], host: "192.0.2.1"},
            {caseId: "CMD-005", name: "preview의 값 없는 CLI 옵션", command: "preview", args: ["--host"], host: "192.0.2.1"},
            {caseId: "CMD-006", name: "preview의 설정 파일 주소", command: "preview", args: [], host: "127.0.0.1"},
            {caseId: "CMD-007", name: "기본 dev 명령의 LAN 설정", command: undefined, args: [], host: true},
            {caseId: "CMD-008", name: "기본 dev 명령의 값 없는 CLI 옵션", command: undefined, args: ["--host"], host: "192.0.2.1"},
            {caseId: "CMD-009", name: "기본 dev 명령의 CLI 주소", command: undefined, args: ["--host", "127.0.0.1"], host: "192.0.2.1"},
            {caseId: "CMD-010", name: "기본 dev 명령의 등호 CLI 주소", command: undefined, args: ["--host=127.0.0.1"], host: "192.0.2.1"},
        ])("[$caseId] $name 입력을 적용해 HTTP 요청을 받는다", async (scenario, {root}) => {
            /**
             * GIVEN
             * 빈 포트와 수신 주소를 지정한 최소 문서 프로젝트
             */
            const reservation = createServer();
            reservation.listen(0, "127.0.0.1");
            await once(reservation, "listening");
            const address = reservation.address();

            if (address === null || typeof address === "string") {
                throw new Error("테스트 서버의 빈 포트가 없습니다");
            }

            await new Promise<void>((resolve, reject) => reservation.close((error) => (error === undefined ? resolve() : reject(error))));
            await mkdir(join(root, "content/public"), {recursive: true});
            await mkdir(join(root, "content/dist"));
            await writeFile(join(root, "content/README.md"), "# Network home\n");
            await writeFile(join(root, "content/dist/index.html"), "<!doctype html><h1>Network home</h1>");
            await writeFile(join(root, "for-humanity.config.mjs"), `export default ${JSON.stringify({port: address.port, host: scenario.host})};\n`);

            /**
             * WHEN
             * 실제 설치 진입점의 서버 명령 실행
             */
            const server = spawn(process.execPath, [resolve("dist/cli.js"), ...(scenario.command === undefined ? [] : [scenario.command]), ...scenario.args], {
                cwd: root,
                stdio: ["ignore", "pipe", "pipe"],
            });
            let log = "";

            server.stdout.on("data", (chunk) => {
                log += String(chunk);
            });
            server.stderr.on("data", (chunk) => {
                log += String(chunk);
            });

            try {
                const url = `http://127.0.0.1:${address.port}/`;

                await expect
                    .poll(
                        async () => {
                            if (server.exitCode !== null) {
                                throw new Error(log);
                            }

                            try {
                                return (await fetch(url, {signal: AbortSignal.timeout(500)})).status;
                            } catch {
                                return 0;
                            }
                        },
                        {timeout: 10000},
                    )
                    .toBe(200);

                /**
                 * THEN
                 * 지정한 주소로의 실제 HTTP 연결과 문서 응답
                 */
                expect(await (await fetch(url)).text()).toContain("Network home");
            } finally {
                if (server.exitCode === null && server.signalCode === null) {
                    const stopped = once(server, "exit", {signal: AbortSignal.timeout(5000)});
                    server.kill("SIGTERM");

                    try {
                        await stopped;
                    } finally {
                        if (server.exitCode === null && server.signalCode === null) {
                            server.kill("SIGKILL");
                        }
                    }
                }
            }
        });
    });
});

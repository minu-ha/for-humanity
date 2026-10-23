import {execFileSync, spawnSync} from "node:child_process";
import {mkdir, readdir, readFile, symlink, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {parse} from "yaml";
import {z} from "zod";

/**
 * 테스트 실행기의 로그 생략과 분리한 실제 CLI 환경
 */
const cliEnv = {
    ...process.env,
    // biome-ignore lint/style/useNamingConvention: Consola의 외부 환경 변수 계약
    CONSOLA_LEVEL: "3",
};

/**
 * 실제 CLI의 초기화 결과와 기존 프로젝트 보존
 */
describe("프로젝트 초기화", () => {
    test("[INIT-001] 도움말은 설정 실행이나 파일 생성 없이 초기화 옵션을 안내한다", async ({root}) => {
        await writeFile(join(root, "for-humanity.config.ts"), 'throw new Error("CONFIG_MUST_NOT_RUN");');
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--help"], {cwd: root, encoding: "utf8", env: cliEnv});
        expect(result.status, result.stderr).toBe(0);
        expect(result.stdout).toContain("--deploy");
        expect(result.stdout).toContain("--yes");
        expect(await readdir(root)).toEqual(["for-humanity.config.ts"]);
    });

    test("[INIT-002] 기본 초기화는 바로 빌드할 수 있는 문서와 실행 명령을 준비한다", async ({root}) => {
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});
        expect(result.status, result.stderr).toBe(0);
        expect(await readFile(join(root, "for-humanity.config.ts"), "utf8")).toContain("satisfies SiteConfig");
        expect((await readdir(join(root, "content"))).toSorted()).toEqual(["README.md", "asset", "private", "public"]);
        const manifest = z
            .object({private: z.boolean(), scripts: z.record(z.string(), z.string()), devDependencies: z.record(z.string(), z.string())})
            .parse(JSON.parse(await readFile(join(root, "package.json"), "utf8")));
        expect(manifest.scripts).toEqual({"docs:dev": "for-humanity dev", "docs:build": "for-humanity build", "docs:preview": "for-humanity preview"});
        expect(manifest.private).toBe(true);
        expect(manifest.devDependencies["for-humanity"]).toBe(z.object({version: z.string()}).parse(JSON.parse(await readFile("package.json", "utf8"))).version);
        expect(await readFile(join(root, ".gitignore"), "utf8")).toContain("/content/dist/");
        expect(result.stdout).toContain("npm run docs:dev");
        expect(result.stdout).toContain("npm install");
        const build = spawnSync(process.execPath, [resolve("dist/cli.js"), "build"], {cwd: root, encoding: "utf8", env: cliEnv, timeout: 30000});
        expect(build.status, build.stderr).toBe(0);
        expect(await readFile(join(root, "content/dist/index.html"), "utf8")).toContain("Project notes");
    });

    test("[INIT-003] 앱 설정과 기존 스크립트, 의존성, gitignore의 내용을 유지한다", async ({root}) => {
        await writeFile(
            join(root, "package.json"),
            '{\n\t"name": "existing-app",\n\t"type": "commonjs",\n\t"scripts": {"dev": "vite", "build": "tsc"},\n\t"custom": {"keep": true},\n\t"dependencies": {"react": "19.0.0"}\n}\n',
        );
        await writeFile(join(root, ".gitignore"), "node_modules\r\n# Keep this comment\r\n");
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm", "--content", "handbook", "--title", "Team notes"], {
            cwd: root,
            encoding: "utf8",
            env: cliEnv,
        });
        expect(result.status, result.stderr).toBe(0);
        const manifest: unknown = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
        expect(manifest).toMatchObject({name: "existing-app", type: "commonjs", custom: {keep: true}, dependencies: {react: "19.0.0"}, scripts: {dev: "vite", build: "tsc"}});
        expect(await readFile(join(root, "package.json"), "utf8")).toContain('\n\t"name"');
        expect(await readFile(join(root, ".gitignore"), "utf8")).toBe("node_modules\r\n# Keep this comment\r\n/handbook/dist/\r\n");
        expect(await readFile(join(root, "handbook/README.md"), "utf8")).toContain("Team notes");
        expect(await readFile(join(root, "for-humanity.config.ts"), "utf8")).toContain('"handbook"');
    });

    test.for(["for-humanity.config.ts", "for-humanity.config.mjs", "content/README.md", "content/private/notes.md"])(
        "[INIT-004] 기존 %s와 충돌하면 전체 초기화를 중단한다",
        async (file, {root}) => {
            await mkdir(join(root, file, ".."), {recursive: true});
            await writeFile(join(root, file), "KEEP_ME");
            const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});
            expect(result.status).not.toBe(0);
            expect(await readFile(join(root, file), "utf8")).toBe("KEEP_ME");
            expect(await readdir(root)).not.toContain("package.json");
            expect(result.stderr).toMatch(/already|existing|conflict/i);
        },
    );

    test("[INIT-005] 충돌하는 docs 스크립트를 덮어쓰지 않는다", async ({root}) => {
        const original = '{"scripts":{"docs:build":"custom build"}}';
        await writeFile(join(root, "package.json"), original);
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("docs:build");
        expect(await readFile(join(root, "package.json"), "utf8")).toBe(original);
        expect(await readdir(root)).toEqual(["package.json"]);
    });

    // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions 표현식의 파일 경로 입력 거부 검사
    test.for(["../outside", "/absolute", "dist", "content/${{secrets.VALUE}}"])("[INIT-006] 잘못된 문서 경로 %s는 쓰기 전에 거부한다", async (content, {root}) => {
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm", "--content", content], {cwd: root, encoding: "utf8", env: cliEnv});
        expect(result.status).toBe(1);
        expect(await readdir(root)).toEqual([]);
    });

    test.for([["--unknown"], ["--deploy", "invalid"], ["--lang", "bad language"], ["--deploy", "github-pages"], [".", "extra"]])(
        "[INIT-007] 잘못되거나 부족한 옵션 %j는 파일을 만들지 않는다",
        async (args, {root}) => {
            const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm", ...args], {cwd: root, encoding: "utf8", env: cliEnv});
            expect(result.status).toBe(1);
            expect(await readdir(root)).toEqual([]);
        },
    );

    test.for([
        ["example/notes", "/notes/"],
        ["example/example.github.io", "/"],
    ])("[INIT-008] GitHub %s의 주소와 배포 파일을 생성한다", async ([repository, basePath], {root}) => {
        const result = spawnSync(
            process.execPath,
            [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm", "--deploy", "github-pages", "--repository", repository, "--branch", "master"],
            {cwd: root, encoding: "utf8", env: cliEnv},
        );
        expect(result.status, result.stderr).toBe(0);
        const config = await readFile(join(root, "for-humanity.config.ts"), "utf8");
        expect(config).toContain('"https://example.github.io"');
        expect(config).toContain(JSON.stringify(basePath));
        const workflow: unknown = parse(await readFile(join(root, ".github/workflows/docs.yml"), "utf8"));
        expect(workflow).toMatchObject({on: {push: {branches: ["master"]}}, jobs: {build: {steps: expect.arrayContaining([{run: "npm ci"}, {run: "npm run docs:build"}])}}});
        expect(result.stdout).toContain("GitHub Actions");
    });

    test.for(["npm", "pnpm"])("Workers는 %s의 빌드와 배포 명령을 생성한다", async (manager, {root}) => {
        await writeFile(join(root, "package.json"), '{"name":"team-docs","scripts":{"build":"existing-build"},"dependencies":{"for-humanity":"~0.18.0"}}');
        const result = spawnSync(
            process.execPath,
            [resolve("dist/cli.js"), "init", "--yes", "--manager", manager, "--deploy", "cloudflare-workers", "--content", "team notes", "--worker-name", "team-docs-site"],
            {cwd: root, encoding: "utf8", env: cliEnv},
        );

        expect(result.status, result.stderr).toBe(0);
        const manifest: unknown = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
        expect(manifest).toMatchObject({
            dependencies: {"for-humanity": "~0.18.0"},
            devDependencies: {wrangler: expect.stringMatching(/^4\./)},
            scripts: {
                build: "existing-build",
                "docs:build": "for-humanity build && node .cloudflare/prepare.mjs",
                "docs:deploy": `${manager === "npm" ? "npm run" : "pnpm"} docs:build && wrangler deploy`,
            },
        });
        const config: unknown = JSON.parse(await readFile(join(root, "wrangler.jsonc"), "utf8"));
        expect(config).toMatchObject({
            name: "team-docs-site",
            compatibility_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            workers_dev: true,
            preview_urls: true,
            previews: {},
            assets: {directory: "team notes/dist", html_handling: "force-trailing-slash", not_found_handling: "404-page"},
        });
        expect(config).not.toHaveProperty("main");
        expect(config).not.toHaveProperty("routes");
        expect(await readFile(join(root, ".gitignore"), "utf8")).toContain("/.wrangler/");
        expect(result.stdout).toContain(`${manager} install`);
        expect(result.stdout).toContain("wrangler deploy");
        const build = spawnSync(process.execPath, [resolve("dist/cli.js"), "build"], {cwd: root, encoding: "utf8", env: cliEnv, timeout: 30000});
        expect(build.status, build.stderr).toBe(0);
        const prepare = spawnSync(process.execPath, [join(root, ".cloudflare/prepare.mjs")], {cwd: resolve("."), encoding: "utf8"});
        expect(prepare.status, prepare.stderr).toBe(0);
        expect(await readFile(join(root, "team notes/dist/404.html"), "utf8")).toContain("Page not found");
        expect(await readFile(join(root, "team notes/dist/_headers"), "utf8")).toContain("no-transform");
    });

    test.for(["wrangler.jsonc", "wrangler.json", "wrangler.toml"])("Workers는 기존 %s가 있으면 쓰기 전에 중단한다", async (file, {root}) => {
        await writeFile(join(root, file), "EXISTING_CONFIG");
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm", "--deploy", "cloudflare-workers"], {
            cwd: root,
            encoding: "utf8",
            env: cliEnv,
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toContain(file);
        expect(await readdir(root)).toEqual([file]);
        expect(await readFile(join(root, file), "utf8")).toBe("EXISTING_CONFIG");
    });

    test("Workers는 기존 Wrangler 의존성과 고유한 프로젝트 이름을 유지한다", async ({root}) => {
        await writeFile(join(root, "package.json"), '{"name":"existing-docs","devDependencies":{"for-humanity":"0.18.0","wrangler":"^4.100.0"}}');
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm", "--deploy", "cloudflare-workers"], {
            cwd: root,
            encoding: "utf8",
            env: cliEnv,
        });

        expect(result.status, result.stderr).toBe(0);
        const manifest: unknown = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
        expect(manifest).toMatchObject({devDependencies: {"for-humanity": "0.18.0", wrangler: "^4.100.0"}});
        expect(JSON.parse(await readFile(join(root, "wrangler.jsonc"), "utf8"))).toMatchObject({name: "existing-docs"});
        expect(result.stdout).not.toContain("npm install");
    });

    test("[INIT-009] Cloudflare는 사용자 문서 경로와 404 출력을 연결한다", async ({root}) => {
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm", "--deploy", "cloudflare-pages", "--content", "handbook"], {
            cwd: root,
            encoding: "utf8",
            env: cliEnv,
        });
        expect(result.status, result.stderr).toBe(0);
        const manifest = z.object({scripts: z.record(z.string(), z.string())}).parse(JSON.parse(await readFile(join(root, "package.json"), "utf8")));
        expect(manifest.scripts["docs:build"]).toContain(".cloudflare/prepare.mjs");
        const build = spawnSync(process.execPath, [resolve("dist/cli.js"), "build"], {cwd: root, encoding: "utf8", env: cliEnv, timeout: 30000});
        expect(build.status, build.stderr).toBe(0);
        const prepare = spawnSync(process.execPath, [".cloudflare/prepare.mjs", ".CLOUDFLARE/PREPARE.MJS"], {cwd: root, encoding: "utf8", env: cliEnv});
        expect(prepare.status, prepare.stderr).toBe(0);
        expect(await readFile(join(root, "handbook/dist/404.html"), "utf8")).toContain("Page not found");
        expect(result.stdout).toContain("handbook/dist");
        expect(result.stdout).toContain("Cloudflare");
    });

    test("[INIT-010] packageManager 선언에 맞춘 pnpm 워크플로를 생성한다", async ({root}) => {
        await writeFile(join(root, "package.json"), '{"name":"docs","packageManager":"pnpm@10.33.2"}');
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--deploy", "github-pages", "--repository", "example/docs"], {
            cwd: root,
            encoding: "utf8",
            env: cliEnv,
        });
        expect(result.status, result.stderr).toBe(0);
        const workflow = await readFile(join(root, ".github/workflows/docs.yml"), "utf8");
        expect(workflow).toContain("pnpm install --frozen-lockfile");
        expect(workflow).toContain("pnpm docs:build");
        expect(result.stdout).toContain("pnpm docs:dev");
    });

    test("[INIT-011] 비대화형 실행은 --yes 안내와 함께 변경 없이 끝난다", async ({root}) => {
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init"], {cwd: root, encoding: "utf8", env: cliEnv, timeout: 5000});
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("--yes");
        expect(await readdir(root)).toEqual([]);
    });

    test("[INIT-012] 문서 경로의 심볼릭 링크를 따라 외부에 파일을 쓰지 않는다", async ({root}) => {
        await mkdir(join(root, "outside"));
        await symlink(join(root, "outside"), join(root, "content"), process.platform === "win32" ? "junction" : "dir");
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});
        expect(result.status).toBe(1);
        expect(await readdir(join(root, "outside"))).toEqual([]);
        expect(await readdir(root)).not.toContain("package.json");
    });

    test("[INIT-017] 새 하위 프로젝트를 만들고 재실행에서는 생성한 파일을 유지한다", async ({root}) => {
        const target = join(root, "team handbook");
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", target, "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});
        expect(result.status, result.stderr).toBe(0);
        const config = await readFile(join(target, "for-humanity.config.ts"), "utf8");
        const repeated = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", target, "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});

        expect(repeated.status).toBe(1);
        expect(await readFile(join(target, "for-humanity.config.ts"), "utf8")).toBe(config);
        expect(result.stdout).toContain("cd 'team handbook'");
    });

    test("[INIT-018] 설치된 버전과 의존성 위치, 같은 docs 스크립트를 유지한다", async ({root}) => {
        await writeFile(join(root, "package.json"), '{"name":"installed","dependencies":{"for-humanity":"~0.17.0"},"scripts":{"docs:build":"for-humanity build"}}');
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});

        expect(result.status, result.stderr).toBe(0);
        const manifest: unknown = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
        expect(manifest).toMatchObject({dependencies: {"for-humanity": "~0.17.0"}, scripts: {"docs:build": "for-humanity build"}});
        expect(manifest).not.toHaveProperty("devDependencies");
    });

    test("[INIT-019] 기존 호스팅 워크플로가 있으면 공통 파일도 만들지 않는다", async ({root}) => {
        await mkdir(join(root, ".github/workflows"), {recursive: true});
        await writeFile(join(root, ".github/workflows/docs.yml"), "EXISTING_WORKFLOW");
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--deploy", "github-pages", "--repository", "example/docs", "--manager", "npm"], {
            cwd: root,
            encoding: "utf8",
            env: cliEnv,
        });

        expect(result.status).toBe(1);
        expect(await readFile(join(root, ".github/workflows/docs.yml"), "utf8")).toBe("EXISTING_WORKFLOW");
        expect(await readdir(root)).toEqual([".github"]);
    });

    test("[INIT-020] 명시적 배포 옵션은 비대화형 환경에서 기본값으로 실행한다", async ({root}) => {
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--deploy", "none", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});

        expect(result.status, result.stderr).toBe(0);
        expect(await readdir(root)).toContain("for-humanity.config.ts");
    });

    test("[INIT-021] GitHub 사용자 도메인은 사이트 루트와 정규화한 주소를 사용한다", async ({root}) => {
        const result = spawnSync(
            process.execPath,
            [resolve("dist/cli.js"), "init", "--yes", "--deploy", "github-pages", "--repository", "example/docs", "--url", "https://docs.example.org/", "--manager", "npm"],
            {cwd: root, encoding: "utf8", env: cliEnv},
        );

        expect(result.status, result.stderr).toBe(0);
        const config = await readFile(join(root, "for-humanity.config.ts"), "utf8");
        expect(config).toContain('"basePath": "/"');
        expect(config).toContain('"url": "https://docs.example.org"');
    });

    test("[INIT-022] remote 없이도 로컬 master 브랜치를 감지한다", async ({root}) => {
        execFileSync("git", ["init", "--initial-branch", "master"], {cwd: root, stdio: "ignore"});
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--deploy", "github-pages", "--repository", "example/docs", "--manager", "npm"], {
            cwd: root,
            encoding: "utf8",
            env: cliEnv,
        });

        expect(result.status, result.stderr).toBe(0);
        expect(await readFile(join(root, ".github/workflows/docs.yml"), "utf8")).toMatch(/branches:\s*- master/);
    });

    test.for(["for-humanity.config.mjs", "for-humanity.config.ts/docs", "package.json/docs", ".gitignore/docs", ".cloudflare/prepare.mjs", ".CLOUDFLARE/PREPARE.MJS"])(
        "[INIT-023] 생성할 파일과 겹치는 문서 폴더 %s는 계획 단계에서 거부한다",
        async (content, {root}) => {
            const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--deploy", "cloudflare-pages", "--content", content, "--manager", "npm"], {
                cwd: root,
                encoding: "utf8",
                env: cliEnv,
            });

            expect(result.status).toBe(1);
            expect(result.stdout).not.toContain("create  ");
            expect(await readdir(root)).toEqual([]);
        },
    );

    test("[INIT-024] UTF-8 BOM과 기존 package.json의 설정을 보존한다", async ({root}) => {
        await writeFile(join(root, "package.json"), '\uFEFF{\r\n\t"name":"existing",\r\n\t"private":true\r\n}\r\n');
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "init", "--yes", "--manager", "npm"], {cwd: root, encoding: "utf8", env: cliEnv});

        expect(result.status, result.stderr).toBe(0);
        const manifest = await readFile(join(root, "package.json"), "utf8");
        expect(manifest).toMatch(/^\uFEFF\{\r\n\t"name": "existing"/);
        expect(await readFile(join(root, "content/README.md"), "utf8")).toContain("existing");
    });
});

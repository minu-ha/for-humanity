import assert from "node:assert/strict";
import {execFileSync, spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {cp, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, writeFile} from "node:fs/promises";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {chromium, expect} from "@playwright/test";
import {packReportSchema} from "@tool/_type/pack-report";
import {packageMetadataSchema} from "@tool/_type/package-metadata";

/*
 * 패키지 설치 검증. 별도 소비 프로젝트에 압축 파일 설치 후 CLI, 브라우저, 공개 타입, 빌드 출력 확인
 */
const [directory] = process.argv.slice(2);

if (directory === undefined) {
    throw new Error("Usage: pnpm exec tsx util/smoke-package.ts <artifact directory>");
}

const artifactDirectory = resolve(directory);
const pack = packReportSchema.parse(JSON.parse(await readFile(join(artifactDirectory, "pack.json"), "utf8")));

// Windows 임시 폴더의 8.3 축약 경로를 전체 경로로 정규화, Vite 파일 접근 계약 준수
const consumer = await realpath(await mkdtemp(join(tmpdir(), "for-humanity-consumer-")));

try {
    await mkdir(join(consumer, "content/public"), {recursive: true});
    await mkdir(join(consumer, "content/private"));
    await writeFile(join(consumer, "content/private/internal.md"), "---\nname: Internal only\nlabel: Internal only\ngroup: Internal\n---\n\nINTERNAL_PACKAGE_SENTINEL");

    const nestedGroup = ["Projects", "Example", "Guide"];

    await writeFile(join(consumer, "package.json"), JSON.stringify({name: "release-consumer", private: true, type: "module"}));
    await writeFile(join(consumer, "content/README.md"), "# Package home\n\n[Guide](public/guide.md)\n");
    await writeFile(join(consumer, "content/AGENTS.md"), "# Private instructions\n");
    await writeFile(join(consumer, "content/CLAUDE.md"), "# Private instructions\n");

    await writeFile(
        join(consumer, "content/public/guide.md"),
        "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n# Guide\n\n```mermaid\nflowchart LR\n    A[Markdown] --> B[HTML]\n```\n",
    );

    await mkdir(join(consumer, "content/public/guide"));
    await mkdir(join(consumer, "content/asset"));
    await writeFile(join(consumer, "content/asset", "local image.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>');

    await writeFile(
        join(consumer, "content/public/guide/options.md"),
        "---\nname: Options\nlabel: Options\ngroup: Guide\nparent: ../guide\n---\n\nChild page.\n\n![Local](../../asset/local%20image.svg)\n\n[Expand](../../asset/local%20image.svg)\n",
    );

    await writeFile(
        join(consumer, "content/public/guide/agents.md"),
        `---\nname: Nested guide\nlabel: Nested guide\ngroup: ${JSON.stringify(nestedGroup)}\n---\n\n# Nested guide\n`,
    );

    const configPath = join(consumer, "for-humanity.config.ts");
    const site = {url: "https://docs.example.org", navigation: [nestedGroup, "Guide"]};
    const config = `import type {SiteConfig} from "for-humanity";\nexport default ${JSON.stringify(site)} satisfies SiteConfig;\n`;

    await writeFile(configPath, config);

    // Windows의 npm.cmd 대신 Node 배포본에 포함된 CLI를 직접 실행
    execFileSync(
        process.platform === "win32" ? process.execPath : "npm",
        [
            ...(process.platform === "win32" ? [join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")] : []),
            "install",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            join(artifactDirectory, pack.filename),
        ],
        {cwd: consumer, stdio: "inherit"},
    );

    const packageRoot = join(consumer, "node_modules", pack.name);
    const installed = packageMetadataSchema.parse(JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8")));

    assert.equal(installed.version, pack.version);
    assert.equal(await readFile(join(packageRoot, "README.md"), "utf8"), await readFile("README.md", "utf8"));

    // 소비 프로젝트에서 CLI 메타데이터와 도움말의 패키지 상대 경로 검증
    assert.equal(execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "--version"], {cwd: consumer, encoding: "utf8"}).trim(), pack.version);
    assert.match(execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "--help"], {cwd: consumer, encoding: "utf8"}), /USAGE.*for-humanity build/);

    // 저장소 별칭, 개발 의존성이 없는 소비자에서 공개 선언과 중첩 입력 타입 검증
    const compiler = resolve("node_modules/typescript/bin/tsc");

    await writeFile(
        join(consumer, "tsconfig.json"),
        JSON.stringify({compilerOptions: {strict: true, noEmit: true, target: "ESNext", module: "NodeNext", types: []}, files: ["for-humanity.config.ts"]}),
    );

    execFileSync(process.execPath, [compiler, "--project", "tsconfig.json"], {cwd: consumer, stdio: "inherit"});

    for (const invalid of [
        {port: "4321"},
        {basePath: false},
        {navigation: [false]},
        {status: [{phrase: "Reviewed", kind: "unknown"}]},
        {titel: "Typo"},
        {content: {root: false}},
    ]) {
        await writeFile(configPath, `import type {SiteConfig} from "for-humanity";\nexport default ${JSON.stringify(invalid)} satisfies SiteConfig;\n`);

        const checked = spawnSync(process.execPath, [compiler, "--project", "tsconfig.json"], {cwd: consumer, encoding: "utf8"});

        assert.equal(checked.error, undefined);
        assert.notEqual(checked.status, 0, `Invalid config must fail type checking: ${JSON.stringify(invalid)}`);
        assert.match(checked.stdout, /for-humanity\.config\.ts/);
    }

    await writeFile(configPath, config);

    const packageFiles = await readdir(packageRoot, {recursive: true});

    assert.ok(!packageFiles.some((file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file)), "consumer package must exclude repository tests");
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});

    const output = join(consumer, "content/dist");
    const home = await readFile(join(output, "index.html"), "utf8");

    assert.match(home, /Package home/);
    assert.doesNotMatch(home, /INTERNAL_PACKAGE_SENTINEL|Internal only/);
    assert.ok(!(await readdir(output)).includes("private"));
    assert.equal(await readFile(join(output, "robots.txt"), "utf8"), "User-agent: *\nAllow: /\n\nSitemap: https://docs.example.org/sitemap.xml\n");

    const sitemap = await readFile(join(output, "sitemap.xml"), "utf8");

    assert.deepEqual(
        [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((entry) => entry[1]).toSorted(),
        ["https://docs.example.org/", "https://docs.example.org/guide/", "https://docs.example.org/guide/agents/", "https://docs.example.org/guide/options/"].toSorted(),
    );

    const stylePath = home.match(/rel="stylesheet" href="([^"]+)"/)?.[1];

    assert.ok(stylePath);
    assert.doesNotMatch(home, /<script\b[^>]*\bsrc=/);
    assert.match(stylePath, /^\/_fh\/style\.[a-f0-9]+\.css$/);
    assert.equal(await readFile(join(output, stylePath), "utf8"), await readFile(join(packageRoot, "dist/cli.css"), "utf8"));

    const browserScript = await readFile(join(packageRoot, "dist/browser.js"), "utf8");

    assert.ok(home.includes(`<script>${browserScript}</script>`));
    assert.ok(home.indexOf(`<script>${browserScript}</script>`) < home.indexOf('<main class="wg_shell__main">'));

    const guide = await readFile(join(output, "guide/index.html"), "utf8");
    const mermaidPath = guide.match(/data-mermaid-module="([^"]+)"/)?.[1];

    assert.ok(mermaidPath);
    assert.match(mermaidPath, /^\/_fh\/mermaid\/mermaid-[A-Za-z0-9_-]+\.js$/);
    assert.match(guide, /data-mermaid-source/);
    assert.doesNotMatch(guide, /ascii-flow/);
    assert.equal(installed.dependencies?.mermaid, undefined, "the prebuilt runtime must not require a second Mermaid installation");

    const mermaidFiles = await readdir(join(packageRoot, "dist/mermaid"));

    for (const name of mermaidFiles) {
        assert.equal(await readFile(join(output, "_fh/mermaid", name), "utf8"), await readFile(join(packageRoot, "dist/mermaid", name), "utf8"));
    }

    const nested = await readFile(join(output, "guide/agents/index.html"), "utf8");
    const nestedNavigation = nested.match(/<nav\b[^>]*class="wg_docTree__root"[\s\S]*?<\/nav>/)?.[0];

    assert.ok(nestedNavigation);
    assert.match(nested, /Example<\/span><ul\b/);
    assert.match(nested, /Guide<\/span><ul\b/);
    assert.match(nested, /href="\/guide\/agents\/"[^>]*aria-current="page"/);
    assert.equal([...nestedNavigation.matchAll(/wg_docList__link--active/g)].length, 1);

    const child = await readFile(join(output, "guide/options/index.html"), "utf8");
    const childNavigation = child.match(/<nav\b[^>]*class="wg_docTree__root"[\s\S]*?<\/nav>/)?.[0];

    assert.ok(childNavigation);
    assert.match(child, /href="\/guide\/"[^>]*>Guide<\/a><ul\b[^>]*aria-label="Guide"/);
    assert.match(child, /href="\/guide\/options\/"[^>]*aria-current="page"/);

    const imagePath = child.match(/src="(\/_fh\/media\/asset\.[a-f0-9]+\.svg)"/)?.[1];

    assert.ok(imagePath);
    assert.equal(await readFile(join(output, imagePath), "utf8"), await readFile(join(consumer, "content/asset", "local image.svg"), "utf8"));
    assert.ok(child.includes(`href="${imagePath}"`));
    assert.equal([...child.matchAll(/href="\/guide\/options\/"/g)].length, 1);
    assert.equal([...child.matchAll(/aria-current="page"/g)].length, 1);
    assert.equal([...childNavigation.matchAll(/wg_docList__link--active/g)].length, 1);
    assert.ok(nested.indexOf('aria-label="Projects"') < nested.indexOf('aria-label="Guide"'));

    const entries = (await readdir(output, {recursive: true})).map((path) => path.replaceAll("\\", "/"));

    assert.ok(!entries.includes("agents/index.html"));
    assert.ok(!entries.includes("claude/index.html"));

    for (const extension of [".woff2", ".css", ".svg"]) {
        assert.ok(
            entries.some((file) => file.endsWith(extension)),
            `Missing ${extension} assets`,
        );
    }

    // 설치 CLI의 실제 브라우저 동작과 종료 검증, 설정과 문서는 검사 후 복원
    for (const command of ["dev", "preview"] as const) {
        const reservation = createServer();

        reservation.listen(0, "localhost");
        await once(reservation, "listening");

        const address = reservation.address();

        assert.ok(address !== null && typeof address !== "string");
        await new Promise<void>((resolve, reject) => reservation.close((error) => (error === undefined ? resolve() : reject(error))));

        const homePath = join(consumer, "content/README.md");
        const originalConfig = await readFile(configPath, "utf8");
        const originalHome = await readFile(homePath, "utf8");

        await writeFile(configPath, `import type {SiteConfig} from "for-humanity";\nexport default ${JSON.stringify({...site, port: address.port})} satisfies SiteConfig;\n`);

        const server = spawn(process.execPath, [join(packageRoot, "dist/cli.js"), command, "."], {
            cwd: consumer,

            // biome-ignore lint/style/useNamingConvention: Vite의 디버그 환경 변수 계약
            env: {...process.env, DEBUG: "vite:resolve*,vite:load*"},
            stdio: ["ignore", "pipe", "pipe"],
        });

        let serverLog = "";

        server.stdout.on("data", (chunk) => {
            serverLog += String(chunk);
        });

        server.stderr.on("data", (chunk) => {
            serverLog += String(chunk);
        });

        try {
            const url = `http://localhost:${address.port}`;

            await expect
                .poll(
                    async () => {
                        if (server.exitCode !== null) {
                            throw new Error(serverLog);
                        }

                        try {
                            return (await fetch(url, {signal: AbortSignal.timeout(1000)})).status;
                        } catch {
                            return 0;
                        }
                    },
                    {timeout: 20000, message: `${command} server must become ready`},
                )
                .toBe(200);

            const browser = await chromium.launch({channel: process.env.FH_TEST_BROWSER_CHANNEL});

            try {
                const page = await browser.newPage();
                const errors: string[] = [];

                page.on("pageerror", (error) => errors.push(error.message));

                page.on("requestfailed", (request) => {
                    serverLog += `\n${request.method()} ${request.url()}: ${request.failure()?.errorText}`;
                });

                page.on("response", (response) => {
                    if (!response.ok()) {
                        serverLog += `\n${response.status()} ${response.url()}`;
                    }
                });

                if (command === "dev") {
                    const client = await page.request.get(`${url}/@vite/client`);

                    assert.equal(client.status(), 200, `Vite client response: ${await client.text()}`);

                    const connected = page.waitForEvent("console", {
                        predicate: (message) => {
                            return message.text().includes("[vite] connected");
                        },
                        timeout: 10000,
                    });

                    assert.equal((await page.request.get(`${url}/private/internal/`)).status(), 200);
                    await page.goto(url);
                    await connected;
                    await writeFile(homePath, "# Installed development\n\nLive package update.\n");
                    await expect(page.getByText("Live package update.", {exact: true})).toBeVisible();

                    for (const path of ["/README.md", "/for-humanity.config.ts", "/_fh/reload"]) {
                        assert.equal((await page.request.get(`${url}${path}`)).status(), 404);
                    }
                } else {
                    const response = await page.goto(url);

                    assert.ok(response !== null);
                    assert.doesNotMatch(await response.text(), /\/@vite\/client/);
                    await expect(page.getByRole("heading", {name: "Package home", exact: true})).toBeVisible();

                    const fontPath = (await response.text()).match(/href="([^"]+\.woff2)"/)?.[1];

                    assert.ok(fontPath);

                    const font = await page.request.get(`${url}${fontPath}`);

                    assert.equal(font.status(), 200);
                    assert.equal(font.headers()["cache-control"], "public, max-age=31536000, immutable");

                    for (const path of ["/private/internal/", "/missing/", "/README.md", "/for-humanity.config.ts", "/@vite/client"]) {
                        assert.equal((await page.request.get(`${url}${path}`)).status(), 404);
                    }

                    assert.equal((await page.request.get(`${url}/guide/options?from=preview`)).status(), 200);
                    await writeFile(homePath, "# Source changed after build\n");
                    await page.reload();
                    await expect(page.getByRole("heading", {name: "Package home", exact: true})).toBeVisible();
                }

                await page.goto(`${url}/guide/`);
                await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(1);
                await page.goto(`${url}/guide/options/`);
                await expect(page.getByRole("img", {name: "Local", exact: true})).toBeVisible();
                assert.deepEqual(errors, []);
            } finally {
                await browser.close();
            }
        } catch (error) {
            throw new Error(`Installed ${command} failed:\n${serverLog}`, {cause: error});
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

            await writeFile(configPath, originalConfig);
            await writeFile(homePath, originalHome);
        }
    }

    const changedBrowserScript = `${browserScript}\n/* changed package bytes */\n`;

    await writeFile(join(packageRoot, "dist/browser.js"), changedBrowserScript);

    // 같은 설치에서 기존 ESM 설정도 계속 지원
    await rm(configPath);
    await writeFile(join(consumer, "for-humanity.config.mjs"), `export default ${JSON.stringify({navigation: [nestedGroup, "Guide"]})};\n`);
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});

    const rebuilt = await readFile(join(output, "index.html"), "utf8");

    assert.equal(rebuilt.match(/rel="stylesheet" href="([^"]+)"/)?.[1], stylePath);
    assert.ok(rebuilt.includes(`<script>${changedBrowserScript}</script>`));

    const rebuiltEntries = (await readdir(output, {recursive: true})).map((path) => path.replaceAll("\\", "/"));

    assert.ok(!rebuiltEntries.includes("robots.txt"), "removing the public URL must also remove previous crawler files");
    assert.ok(!rebuiltEntries.includes("sitemap.xml"), "projects without a public URL must not emit a sitemap");
    assert.ok(!rebuiltEntries.some((file) => file.endsWith(".js") && !file.startsWith("_fh/mermaid/")), "only the lazy Mermaid graph may emit script assets");
    await writeFile(join(consumer, "content/public/guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nOrdinary text.\n");
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});
    assert.ok(!(await readdir(join(output, "_fh"))).includes("mermaid"), "removing all diagrams must remove the previous runtime assets");

    // 설치된 기본형의 빈 폴더 보존, 기본 경로와 사용자 경로의 실제 빌드
    for (const file of ["template/content/private/.gitkeep", "template/content/asset/.gitkeep"]) {
        assert.equal(await readFile(join(packageRoot, file), "utf8"), "");
    }
    assert.match(await readFile(join(packageRoot, "template/github-pages.yml"), "utf8"), /path: content\/dist/);

    const starter = join(consumer, "starter");

    await cp(join(packageRoot, "template"), starter, {recursive: true});
    await writeFile(join(starter, "content/private/draft.md"), "PRIVATE_STARTER_SENTINEL");
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build"], {cwd: starter, stdio: "inherit"});
    assert.match(await readFile(join(starter, "content/dist/index.html"), "utf8"), /href="\/getting-started\/"/);
    assert.ok(!(await readdir(join(starter, "content/dist"))).includes("private"));
    await rename(join(starter, "content"), join(starter, "knowledge"));
    await rename(join(starter, "knowledge/public"), join(starter, "knowledge/published"));
    await rename(join(starter, "knowledge/private"), join(starter, "knowledge/internal"));
    await writeFile(join(starter, "knowledge/README.md"), "# Custom starter\n\n[Start](published/getting-started.md)\n");

    await writeFile(
        join(starter, "for-humanity.config.ts"),
        'import type {SiteConfig} from "for-humanity";\nexport default {basePath: "/package-docs/", url: "https://example.github.io", content: {root: "knowledge", public: "published", private: "internal"}} satisfies SiteConfig;\n',
    );

    await writeFile(
        join(starter, "tsconfig.json"),
        JSON.stringify({compilerOptions: {strict: true, noEmit: true, target: "ESNext", module: "NodeNext", types: []}, files: ["for-humanity.config.ts"]}),
    );

    execFileSync(process.execPath, [compiler, "--project", "tsconfig.json"], {cwd: starter, stdio: "inherit"});
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", starter], {cwd: consumer, stdio: "inherit"});
    assert.match(await readFile(join(starter, "knowledge/dist/index.html"), "utf8"), /Custom starter/);
    assert.match(await readFile(join(starter, "knowledge/dist/getting-started/index.html"), "utf8"), /Getting started/);
    assert.match(await readFile(join(starter, "knowledge/dist/index.html"), "utf8"), /href="\/package-docs\/getting-started\/"/);
    assert.match(await readFile(join(starter, "knowledge/dist/index.html"), "utf8"), /url\(\/package-docs\/_fh\/fonts\//);
    assert.match(await readFile(join(starter, "knowledge/dist/sitemap.xml"), "utf8"), /https:\/\/example.github.io\/package-docs\/getting-started\//);
    assert.ok(!(await readdir(join(starter, "knowledge/dist"))).some((file) => file === "private" || file === "internal"));

    // 설치 번들의 init 진입점과 패키지 상대 템플릿, 생성 결과의 실제 빌드
    for (const setup of [
        {deploy: "none", manager: "npm", content: "content"},
        {deploy: "github-pages", manager: "pnpm", content: "handbook"},
        {deploy: "cloudflare-pages", manager: "npm", content: "team notes"},
        {deploy: "cloudflare-workers", manager: "npm", content: "worker notes"},
        {deploy: "cloudflare-workers", manager: "pnpm", content: "."},
    ]) {
        const initialized = join(consumer, `init-${setup.deploy}-${setup.manager}`);
        const cli = join(packageRoot, "dist/cli.js");

        execFileSync(
            process.execPath,
            [cli, "init", initialized, "--yes", "--manager", setup.manager, "--deploy", setup.deploy, "--content", setup.content, "--repository", "example/package-docs"],
            {cwd: consumer, stdio: "inherit"},
        );

        assert.ok((await readFile(join(initialized, "package.json"), "utf8")).includes(JSON.stringify(pack.version)));
        assert.match(await readFile(join(initialized, "for-humanity.config.ts"), "utf8"), /satisfies SiteConfig/);
        await writeFile(join(initialized, setup.content, "private/internal.md"), "---\nname: Init private\nlabel: Init private\ngroup: Internal\n---\n\nINIT_PRIVATE_SENTINEL\n");
        execFileSync(process.execPath, [cli, "build"], {cwd: initialized, stdio: "inherit"});

        const initializedOutput = join(initialized, setup.content, "dist");
        const initializedHome = await readFile(join(initializedOutput, "index.html"), "utf8");

        assert.match(initializedHome, /Project notes/);
        assert.doesNotMatch(initializedHome, /INIT_PRIVATE_SENTINEL/);
        assert.ok(!(await readdir(initializedOutput)).includes("private"));

        if (setup.deploy === "github-pages") {
            assert.match(initializedHome, /href="\/package-docs\/getting-started\/"/);
            assert.match(await readFile(join(initialized, ".github/workflows/docs.yml"), "utf8"), /pnpm install --frozen-lockfile/);
        } else if (setup.deploy === "cloudflare-pages" || setup.deploy === "cloudflare-workers") {
            execFileSync(process.execPath, [join(initialized, ".cloudflare/prepare.mjs")], {cwd: consumer, stdio: "inherit"});
            assert.match(await readFile(join(initializedOutput, "404.html"), "utf8"), /Page not found/);

            if (setup.deploy === "cloudflare-workers") {
                const config = await readFile(join(initialized, "wrangler.jsonc"), "utf8");
                assert.ok(config.includes(JSON.stringify(setup.content === "." ? "dist" : `${setup.content}/dist`)));
                assert.match(config, /"not_found_handling": "404-page"/);
                assert.doesNotMatch(config, /"main"|"routes"/);
                const manifest = await readFile(join(initialized, "package.json"), "utf8");
                assert.match(manifest, /"wrangler": "4\./);
                assert.ok(manifest.includes(JSON.stringify(`${setup.manager === "npm" ? "npm run" : "pnpm"} docs:build && wrangler deploy`)));
                assert.match(await readFile(join(initializedOutput, "_headers"), "utf8"), /no-transform/);
            }
        }
    }

    console.log(
        `Installed ${pack.name}@${pack.version} on ${process.version}: dev/preview browsers, config types, TS/ESM settings, assets, navigation, images, Mermaid, README, crawler files, content starters and all init hosting targets passed`,
    );
} finally {
    await rm(consumer, {recursive: true, force: true});
}

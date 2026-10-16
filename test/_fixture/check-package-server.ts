import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {readFile, writeFile} from "node:fs/promises";
import {createServer} from "node:net";
import {join} from "node:path";
import {chromium, expect} from "@playwright/test";
import type {SiteConfig} from "@/type/site-config";

/**
 * 별도 설치 프로젝트에서 검증할 CLI 서버
 */
interface PackageServerParams {
    /**
     * node_modules를 포함한 소비 프로젝트와 문서 루트
     */
    root: string;

    /**
     * 설치된 실행 파일의 절대 경로
     */
    cli: string;

    /**
     * 검증 후 종료할 개발 또는 정적 미리보기 명령
     */
    command: "dev" | "preview";

    /**
     * 포트만 교체할 소비자 설정
     */
    site: SiteConfig;
}

/**
 * 설치 CLI의 실제 브라우저 동작과 종료 검증, 설정과 문서는 검사 후 복원
 */
export const checkPackageServer = async (params: PackageServerParams) => {
    const reservation = createServer();
    reservation.listen(0, "localhost");
    await once(reservation, "listening");
    const address = reservation.address();
    assert.ok(address !== null && typeof address !== "string");
    await new Promise<void>((resolve, reject) => reservation.close((error) => (error === undefined ? resolve() : reject(error))));
    const configPath = join(params.root, "for-humanity.config.ts");
    const homePath = join(params.root, "README.md");
    const originalConfig = await readFile(configPath, "utf8");
    const originalHome = await readFile(homePath, "utf8");
    await writeFile(configPath, `import type {SiteConfig} from "for-humanity";\nexport default ${JSON.stringify({...params.site, port: address.port})} satisfies SiteConfig;\n`);
    const server = spawn(process.execPath, [params.cli, params.command, "."], {
        cwd: params.root,

        // biome-ignore lint/style/useNamingConvention: Vite의 디버그 환경 변수 계약
        env: {...process.env, DEBUG: "vite:resolve*,vite:load*"},
        stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    server.stdout.on("data", (chunk) => {
        output += String(chunk);
    });
    server.stderr.on("data", (chunk) => {
        output += String(chunk);
    });
    try {
        const url = `http://localhost:${address.port}`;
        await expect
            .poll(
                async () => {
                    if (server.exitCode !== null) throw new Error(output);
                    try {
                        return (await fetch(url, {signal: AbortSignal.timeout(1000)})).status;
                    } catch {
                        return 0;
                    }
                },
                {timeout: 20000, message: `${params.command} server must become ready`},
            )
            .toBe(200);
        const browser = await chromium.launch({channel: process.env.FH_TEST_BROWSER_CHANNEL});
        try {
            const page = await browser.newPage();
            const errors: string[] = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("requestfailed", (request) => {
                output += `\n${request.method()} ${request.url()}: ${request.failure()?.errorText}`;
            });
            page.on("response", (response) => {
                if (!response.ok()) output += `\n${response.status()} ${response.url()}`;
            });
            if (params.command === "dev") {
                const client = await page.request.get(`${url}/@vite/client`);
                assert.equal(client.status(), 200, `Vite client response: ${await client.text()}`);
                const connected = page.waitForEvent("console", {
                    predicate: (message) => {
                        return message.text().includes("[vite] connected");
                    },
                    timeout: 10000,
                });
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
                for (const path of ["/missing/", "/README.md", "/for-humanity.config.ts", "/@vite/client"]) {
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
        throw new Error(`Installed ${params.command} failed:\n${output}`, {cause: error});
    } finally {
        if (server.exitCode === null && server.signalCode === null) {
            const stopped = once(server, "exit", {signal: AbortSignal.timeout(5000)});
            server.kill("SIGTERM");
            try {
                await stopped;
            } finally {
                if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");
            }
        }
        await writeFile(configPath, originalConfig);
        await writeFile(homePath, originalHome);
    }
};

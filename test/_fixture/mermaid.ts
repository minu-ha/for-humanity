import {execFileSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {test as base} from "@playwright/test";
import {diagram_cases} from "@test/mermaid/_constant/diagram";
import {build} from "esbuild";
import {Hono} from "hono";

interface BrowserRuntime {
    requests: string[];
    errors: string[];
    consoleErrors: string[];
}

/**
 * 워커마다 격리한 실제 CLI 출력과 빈 포트의 로컬 서버. 브라우저 상태는 케이스마다 격리
 */
export const test = base.extend<{runtime: BrowserRuntime}, {mermaidSite: string}>({
    mermaidSite: [
        // biome-ignore lint/correctness/noEmptyPattern: Playwright가 구조분해 매개변수로 fixture 의존성을 조회
        async ({}, use) => {
            const root = await mkdtemp(join(tmpdir(), "for-humanity-mermaid-browser-"));
            try {
                const diagrams = diagram_cases.map((diagram, index) => `## Diagram ${index}\n\n\`\`\`mermaid\n${diagram.source}\n\`\`\`\n`).join("\n");
                await writeFile(join(root, "README.md"), "# Home\n\nOrdinary content.\n");
                await writeFile(
                    join(root, "guide.md"),
                    `---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n${diagrams}\n:::details[Hidden diagram]\n\n\`\`\`mermaid\nflowchart LR\n    Hidden --> Visible\n\`\`\`\n:::\n`,
                );
                await writeFile(
                    join(root, "hidden.md"),
                    "---\nname: Hidden\nlabel: Hidden\ngroup: Guide\n---\n\n:::details[Hidden diagram]\n\n```mermaid\nflowchart LR\n    Hidden --> Visible\n```\n:::\n",
                );
                await Promise.all(
                    diagram_cases.map((diagram) =>
                        writeFile(
                            join(root, `${diagram.id}.md`),
                            `---\nname: ${diagram.name}\nlabel: ${diagram.name}\ngroup: Examples\n---\n\n\`\`\`mermaid\n${diagram.source}\n\`\`\`\n`,
                        ),
                    ),
                );
                await writeFile(
                    join(root, "error.md"),
                    `---\nname: Errors\nlabel: Errors\ngroup: Guide\n---\n\n\`\`\`mermaid\nnot-a-diagram\n<script>window.mermaidInjected = true</script>\n\`\`\`\n\n\`\`\`mermaid\nflowchart LR\n    Good --> Diagram\n\`\`\`\n\n\`\`\`mermaid\nflowchart LR\n    a["${"x".repeat(50100)}"] --> b\n\`\`\`\n`,
                );
                execFileSync(process.execPath, ["dist/cli.js", "build", root]);
                const fixture = await build({
                    entryPoints: ["test/mermaid/_gallery/lifecycle.tsx"],
                    bundle: true,
                    platform: "browser",
                    format: "iife",
                    jsx: "automatic",
                    jsxImportSource: "hono/jsx/dom",
                    loader: {".css": "empty"},
                    write: false,
                });
                const shell = await readFile("dist/browser.js", "utf8");
                const html = (await readFile(join(root, "dist/guide/index.html"), "utf8"))
                    .replace(`<script>${shell}</script>`, "")
                    .replace("</body>", `<script>${fixture.outputFiles[0].text}</script></body>`);
                const app = new Hono();
                app.get("/lifecycle/", (context) => context.html(html));
                app.use("/*", serveStatic({root: join(root, "dist")}));
                const server = serve({fetch: app.fetch, hostname: "127.0.0.1", port: 0});
                try {
                    await once(server, "listening");
                    const address = server.address();
                    if (address === null || typeof address === "string") throw new Error("Missing local test server port");
                    await use(`http://127.0.0.1:${address.port}`);
                } finally {
                    await new Promise<void>((resolve, reject) => server.close((error) => (error === undefined ? resolve() : reject(error))));
                }
            } finally {
                await rm(root, {recursive: true, force: true});
            }
        },
        {scope: "worker"},
    ],
    baseURL: async ({mermaidSite}, use) => {
        await use(mermaidSite);
    },
    runtime: async ({page}, use) => {
        const runtime: BrowserRuntime = {requests: [], errors: [], consoleErrors: []};
        page.on("request", (request) => runtime.requests.push(request.url()));
        page.on("pageerror", (error) => runtime.errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error") runtime.consoleErrors.push(message.text());
        });
        await use(runtime);
    },
});

import {execFileSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {test as base} from "@playwright/test";
import {build} from "esbuild";
import {Hono} from "hono";

/**
 * 워커별 실제 CLI 사이트, 각 테스트는 독립 브라우저 컨텍스트 사용
 */
export const test = base.extend<Record<never, never>, {navigationSite: string}>({
    navigationSite: [
        // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture 의존성 조회 계약
        async ({}, use) => {
            const root = await mkdtemp(join(tmpdir(), "for-humanity-navigation-"));
            try {
                const sections = Array.from({length: 24}, (_, index) => `## Section ${index}\n\n### Detail ${index}\n\n${"Readable context. ".repeat(40)}\n`).join("\n");
                await writeFile(join(root, "README.md"), "# Home\n\n## Start\n\n[Guide](guide.md)\n");
                await writeFile(join(root, "for-humanity.config.ts"), "export default {cursorFace: true};\n");
                await writeFile(
                    join(root, "guide.md"),
                    `---\nname: Guide\nlabel: Guide\ngroup: Guide\norder: 0\n---\n\n${sections}\n:::details[Folded context]\n### Hidden detail\n\nHidden context.\n:::\n`,
                );
                await writeFile(join(root, "child.md"), "---\nname: Child\nlabel: Child\ngroup: Guide\nparent: guide\norder: 1\n---\n\n## Short page\n\nText.\n");
                await Promise.all(
                    Array.from({length: 60}, (_, index) =>
                        writeFile(join(root, `page-${index}.md`), `---\nname: Page ${index}\nlabel: Page\ngroup: Guide\norder: ${index + 2}\n---\n\n## Read\n\nText.\n`),
                    ),
                );
                execFileSync(process.execPath, ["dist/cli.js", "build", root]);

                const lifecycle = await build({
                    entryPoints: ["test/navigation/_gallery/lifecycle.tsx"],
                    bundle: true,
                    platform: "browser",
                    format: "iife",
                    jsx: "automatic",
                    jsxImportSource: "hono/jsx/dom",
                    loader: {".css": "empty"},
                    write: false,
                });
                const browserScript = await readFile("dist/browser.js", "utf8");
                const html = (await readFile(join(root, "dist/guide/index.html"), "utf8"))
                    .replace(`<script>${browserScript}</script>`, "")
                    .replace("</body>", () => `<script>${lifecycle.outputFiles[0].text}</script></body>`);
                const app = new Hono();
                app.get("/lifecycle/", (context) => context.html(html));
                app.use("/*", serveStatic({root: join(root, "dist")}));
                const server = serve({fetch: app.fetch, hostname: "127.0.0.1", port: 0});
                try {
                    await once(server, "listening");
                    const address = server.address();
                    if (address === null || typeof address === "string") throw new Error("테스트 서버 포트가 없습니다");
                    await use(`http://127.0.0.1:${address.port}`);
                } finally {
                    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
                }
            } finally {
                await rm(root, {recursive: true, force: true});
            }
        },
        {scope: "worker"},
    ],
    baseURL: async ({navigationSite}, use) => {
        await use(navigationSite);
    },
});

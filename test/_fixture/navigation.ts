import {execFileSync} from "node:child_process";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test as base} from "@playwright/test";
import {loadBrowserScript} from "@test/_fixture/load-browser-script";
import {range} from "es-toolkit/math";
import {preview} from "vite";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";

/**
 * 워커별 실제 CLI 사이트, 각 테스트는 독립 브라우저 컨텍스트 사용
 */
export const test = base.extend<Record<never, never>, {navigationSite: string}>({
    navigationSite: [
        // biome-ignore lint/correctness/noEmptyPattern: Playwright가 구조분해 매개변수로 fixture 의존성을 조회
        async ({}, use) => {
            const root = await mkdtemp(join(tmpdir(), "for-humanity-navigation-"));

            try {
                await mkdir(join(root, "public"));

                const sections = range(24)
                    .map((index) => `## Section ${index}\n\n### Detail ${index}\n\n${"Readable context. ".repeat(40)}\n`)
                    .join("\n");

                await writeFile(join(root, "README.md"), "# Home\n\n## Start\n\n[Guide](public/guide.md)\n");
                await writeFile(join(root, "for-humanity.config.ts"), 'export default {content: {root: "."}, cursorFace: true};\n');

                await writeFile(
                    join(root, "public/guide.md"),
                    `---\nname: Guide\nlabel: Guide\ngroup: Guide\norder: 0\n---\n\n${sections}\n:::details[Folded context]\n### Hidden detail\n\nHidden context.\n:::\n`,
                );

                await writeFile(join(root, "public/child.md"), "---\nname: Child\nlabel: Child\ngroup: Guide\nparent: guide\norder: 1\n---\n\n## Short page\n\nText.\n");

                await Promise.all(
                    range(60).map((index) => {
                        return writeFile(
                            join(root, `public/page-${index}.md`),
                            `---\nname: Page ${index}\nlabel: Page\ngroup: Guide\norder: ${index + 2}\n---\n\n## Read\n\nText.\n`,
                        );
                    }),
                );

                execFileSync(process.execPath, ["dist/cli.js", "build", root]);

                const lifecycle = await loadBrowserScript("test/_gallery/navigation-lifecycle.tsx");
                const browserScript = await readFile("dist/browser.js", "utf8");

                const html = (await readFile(join(root, "dist/guide/index.html"), "utf8"))
                    .replace(`<script>${browserScript}</script>`, "")
                    .replace("</body>", () => `<script>${lifecycle}</script></body>`);

                await mkdir(join(root, "dist/lifecycle"));
                await writeFile(join(root, "dist/lifecycle/index.html"), html);

                const server = await preview(toPreviewConfig({root, port: 0, host: "localhost", basePath: "/"}));

                try {
                    const url = server.resolvedUrls?.local[0];

                    if (url === undefined) {
                        throw new Error("미리보기 서버의 테스트 주소가 없습니다");
                    }

                    await use(new URL(url).origin);
                } finally {
                    await server.close();
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

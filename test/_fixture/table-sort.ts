import {execFileSync} from "node:child_process";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test as base} from "@playwright/test";
import {loadBrowserScript} from "@test/_fixture/load-browser-script";
import {preview} from "vite";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";

/**
 * 정렬 대상 표와 대상이 아닌 표를 함께 둔 문서. 첫 표만 버튼이 붙음
 *
 *   - 순번, 같은 이름이 둘인 글자, 숫자가 섞인 글, 빈 칸이 든 날짜 열
 *   - 본문 한 줄, 머리글 링크, 머리 행 없는 원시 HTML, 병합 칸의 원시 HTML
 */
const table_document = [
    "---",
    "name: Tables",
    "label: Tables",
    "group: Guide",
    "---",
    "",
    "## Sortable",
    "",
    "| Order | Name | Years | Deadline |",
    "| --- | --- | --- | --- |",
    "| 1 | Cherry | 10 | 2027-10-22 |",
    "| 2 | Apple | 2 | - |",
    "| 3 | Banana | 3년 이상 | 2026-10-29 |",
    "| 4 | Apple | 2 | 2026-11-01 |",
    "",
    "## Single row",
    "",
    "| Key | Value |",
    "| --- | --- |",
    "| only | one |",
    "",
    "## Linked header",
    "",
    "| [Docs](https://example.com/) | Value |",
    "| --- | --- |",
    "| a | 1 |",
    "| b | 2 |",
    "",
    "## Raw HTML",
    "",
    "<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>",
    "",
    '<table><thead><tr><th colspan="2">Pair</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table>',
    "",
].join("\n");

/**
 * 워커마다 격리한 실제 CLI 출력과 빈 포트의 로컬 서버. /lifecycle/은 셸 번들 대신 갤러리 스크립트
 */
export const test = base.extend<Record<never, never>, {tableSortSite: string}>({
    tableSortSite: [
        // biome-ignore lint/correctness/noEmptyPattern: Playwright가 구조분해 매개변수로 fixture 의존성을 조회
        async ({}, use) => {
            const root = await mkdtemp(join(tmpdir(), "for-humanity-table-sort-"));

            try {
                await mkdir(join(root, "public"));
                await writeFile(join(root, "for-humanity.config.ts"), 'export default {content: {root: "."}};');
                await writeFile(join(root, "README.md"), "# Home\n\nOrdinary content.\n");
                await writeFile(join(root, "public/table.md"), table_document);

                execFileSync(process.execPath, ["dist/cli.js", "build", root]);

                const fixture = await loadBrowserScript("test/_gallery/table-sort-lifecycle.tsx");
                const shell = await readFile("dist/browser.js", "utf8");

                const html = (await readFile(join(root, "dist/table/index.html"), "utf8"))
                    .replace(`<script>${shell}</script>`, "")
                    .replace("</body>", () => `<script>${fixture}</script></body>`);

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
    baseURL: async ({tableSortSite}, use) => {
        await use(tableSortSite);
    },
});

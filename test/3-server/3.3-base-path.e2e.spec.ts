import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/dev";

for (const source of [false, true]) {
    test.describe(source ? "하위 경로 소스 개발" : "하위 경로 설치 번들 개발", () => {
        test.use({source, site: {basePath: "/dev-docs/"}});

        test("[BASE-003] Vite 연결과 소스 스타일, Mermaid, 문서 갱신이 같은 경로에서 동작한다", async ({page, devSite}) => {
            await writeFile(join(devSite.root, "README.md"), "# Project home\n\nBefore update.\n\n```mermaid\nflowchart LR\nA --> B\n```\n");
            const errors: string[] = [];
            page.on("pageerror", (error) => errors.push(error.message));

            await Promise.all([page.waitForEvent("console", (message) => message.text().includes("[vite] connected")), page.goto("/dev-docs/")]);

            await expect(page.locator(".wg_sidebar__docsColumn--ready")).toHaveCount(1);
            await expect(page.locator("body")).toHaveCSS("display", "grid");
            await expect(page.locator("[data-mermaid-status=rendered]")).toHaveCount(1);
            expect((await page.request.get("/dev-docs/@vite/client")).status()).toBe(200);
            expect((await page.request.get("/dev-docs/README.md")).status()).toBe(404);

            await writeFile(join(devSite.root, "README.md"), "# Project home\n\nAfter update.\n");
            await expect(page.getByText("After update.", {exact: true})).toBeVisible();
            await expect(page.locator(".wg_sidebar__brand")).toHaveAttribute("href", "/dev-docs/");
            expect(devSite.errors).toStrictEqual([]);
            expect(errors).toStrictEqual([]);
        });
    });
}

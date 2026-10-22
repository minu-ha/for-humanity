import {expect} from "@playwright/test";
import {test} from "@test/_fixture/docs";

test.use({basePath: "/project-docs/"});

test("[BASE-002] 브라우저 마운트, 문서 이동, Mermaid와 글꼴이 배포 경로를 유지한다", async ({page, basePath, docsSite}) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("response", (response) => {
        if (response.url().startsWith(docsSite) && response.status() >= 400) {
            failures.push(`${response.status()} ${response.url()}`);
        }
    });

    await page.goto(basePath);
    await expect(page.locator("[data-sidebar-docs]")).toHaveCount(1);
    await expect(page.locator("body")).toHaveCSS("display", "grid");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => [...document.fonts].every((font) => font.status !== "error"))).toBe(true);
    await expect(page.locator(".wg_sidebar__brand")).toHaveAttribute("href", basePath);
    await expect(page.locator(".wg_docList__link").first()).toHaveAttribute("href", new RegExp(`^${basePath}`));

    await page.getByRole("navigation", {name: "Document navigation"}).getByRole("link", {name: "Diagrams", exact: true}).click();
    await expect(page).toHaveURL(new RegExp(`${basePath}diagrams/$`));
    await expect(page.locator("[data-mermaid-status=rendered]").first()).toBeVisible();
    await expect(page.locator("[data-cursor-face]")).toHaveAttribute("src", `${basePath}favicon.svg`);
    await page.reload();
    await expect(page.locator("[data-mermaid-status=rendered]").first()).toBeVisible();

    await page.setViewportSize({width: 390, height: 844});
    await page.getByRole("button", {name: "Open navigation"}).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").locator(".wg_docList__link").first()).toHaveAttribute("href", new RegExp(`^${basePath}`));

    expect(failures).toStrictEqual([]);
});

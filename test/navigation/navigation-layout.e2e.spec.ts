import type {BrowserContextOptions} from "@playwright/test";
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/navigation";

const layouts = [
    {viewport: {width: 1920, height: 600}},
    {viewport: {width: 1360, height: 600}, colorScheme: "dark"},
    {viewport: {width: 1359, height: 600}},
    {viewport: {width: 1024, height: 600}},
    {viewport: {width: 1023, height: 600}},
    {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true},
    {viewport: {width: 1360, height: 600}, forcedColors: "active"},
    {viewport: {width: 390, height: 844}, javaScriptEnabled: false},
    {viewport: {width: 1360, height: 600}, javaScriptEnabled: false},
] satisfies BrowserContextOptions[];

test.describe("탐색 레이아웃", () => {
    for (const [index, options] of layouts.entries()) {
        test.describe(`보기 ${index + 1}`, () => {
            test.use(options);
            test(`[NAV-${String(index + 1).padStart(3, "0")}] 화면 크기와 표시 환경에 맞는 탐색을 제공한다`, {tag: "@high"}, async ({page}) => {
                /**
                 * GIVEN
                 * 화면 크기와 시스템 표시 환경
                 */
                const errors: string[] = [];
                page.on("pageerror", (error) => errors.push(error.message));
                /**
                 * WHEN
                 * 문서 조회와 모바일 탐색 공개
                 */
                await page.goto("/guide/");
                const mobile = options.viewport.width < 1024;
                if (mobile && options.javaScriptEnabled !== false) {
                    await page.getByRole("button", {name: "Open navigation", exact: true}).click();
                    expect(await page.locator("dialog").evaluate((element) => element.matches(":modal"))).toBe(true);
                }
                /**
                 * THEN
                 * 수평 넘침 없는 문서와 화면별 탐색 배치
                 */
                expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
                const outline = page.getByRole("navigation", {name: "On this page", exact: true});
                await expect(outline).toBeVisible({visible: options.viewport.width >= 1360});
                const documents = page.locator('[data-navigation-scroll="documents"]');
                if (options.javaScriptEnabled === false) {
                    await expect(page.getByRole("link", {name: "Child", exact: true})).toBeVisible();
                    expect(await documents.evaluate((element) => getComputedStyle(element).scrollbarWidth)).not.toBe("none");
                } else {
                    if (options.viewport.width >= 1360) {
                        const width = await documents.evaluate((element) => element.getBoundingClientRect().width);
                        const outlineWidth = await page.locator('[data-navigation-scroll="outline"]').evaluate((element) => element.getBoundingClientRect().width);
                        expect(width).toBe(200);
                        expect(outlineWidth).toBe(width);
                        // 본문은 1920px 페이지 안에서 양쪽 바깥 여백 28px·사이드바 200px·간격 32px을 뺀 나머지 전체
                        const fill = await page.evaluate(() => Math.min(document.documentElement.getBoundingClientRect().width, 1920) - (28 + 200 + 32) * 2);
                        expect(await page.locator("main").evaluate((element) => element.getBoundingClientRect().width)).toBe(fill);
                    }
                    if (options.forcedColors === "active") expect(await documents.evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe("thin");
                    if (mobile) {
                        await test.step("Escape로 닫으면 탐색 열기 버튼으로 포커스가 복귀한다", async () => {
                            await page.keyboard.press("Escape");
                            await expect(page.locator("dialog")).toHaveJSProperty("open", false);
                            await expect(page.getByRole("button", {name: "Open navigation", exact: true})).toBeFocused();
                        });
                    }
                }
                expect(errors).toStrictEqual([]);
            });
        });
    }
});

import AxeBuilder from "@axe-core/playwright";
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/docs";

test.use({basePath: "/project/", javaScriptEnabled: false});

/**
 * 빌드된 상태 화면(src/page/status, src/component/ui/status)의 실제 브라우저 검증
 */
test.describe("상태 화면", () => {
    for (const layout of [
        {caseId: "STA-007", name: "데스크톱 밝은 테마", options: {viewport: {width: 1600, height: 1000}, colorScheme: "light" as const}},
        {caseId: "STA-008", name: "휴대폰 어두운 테마", options: {viewport: {width: 390, height: 844}, colorScheme: "dark" as const}},
    ]) {
        test.describe(layout.name, () => {
            test.use(layout.options);

            test(`[${layout.caseId}] JavaScript 없이 중앙 안내와 이미지를 표시하고 배포 경로의 홈으로 복귀한다`, {tag: "@high"}, async ({page}) => {
                /**
                 * GIVEN
                 * 하위 경로에 빌드한 사이트, 스크립트를 끈 브라우저
                 */

                /**
                 * WHEN
                 * 없는 중첩 문서 직접 방문
                 */
                const response = await page.goto("/project/missing/nested/");
                const image = page.locator("main img");

                /**
                 * THEN
                 * 기본 이미지의 실제 표시, 좁은 화면의 중앙 배치와 접근 가능한 홈 복귀
                 */
                expect(response?.status()).toBe(404);
                await expect(page.getByRole("heading", {name: "404 Page not found", exact: true})).toBeVisible();
                await expect(image).toHaveAttribute("src", /^\/project\/_fh\/face-sad\.[a-f0-9]+\.svg$/);
                await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
                await page.evaluate(() => document.fonts.ready);

                const layout = await page.locator("main section").evaluate((element) => {
                    const bounds = element.getBoundingClientRect();

                    return {
                        centerX: bounds.x + bounds.width / 2,
                        centerY: bounds.y + bounds.height / 2,
                        width: document.documentElement.clientWidth,
                        height: window.innerHeight,
                        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                    };
                });

                expect(Math.abs(layout.centerX - layout.width / 2)).toBeLessThan(1);
                expect(Math.abs(layout.centerY - layout.height / 2)).toBeLessThan(1);
                expect(layout.overflow).toBe(false);
                await page.keyboard.press("Tab");
                await expect(page.getByRole("link", {name: "Back to home"})).toBeFocused();
                await page.keyboard.press("Enter");
                await expect(page).toHaveURL(/\/project\/$/);
                await expect(page.getByRole("navigation").first()).toBeVisible();
            });
        });
    }

    test.describe("접근성", () => {
        test.use({javaScriptEnabled: true});

        test("[STA-009] 밝은 테마와 어두운 테마의 상태 화면은 axe 위반이 없다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 하위 경로에 빌드한 사이트
             */
            await page.goto("/project/missing/");

            for (const colorScheme of ["light", "dark"] as const) {
                /**
                 * WHEN
                 * 시스템 테마별 상태 화면의 접근성 검사
                 */
                await page.emulateMedia({colorScheme});
                const result = await new AxeBuilder({page}).analyze();

                /**
                 * THEN
                 * WCAG와 권장 사례를 포함한 기본 규칙 위반 없음
                 */
                expect(result.violations).toStrictEqual([]);
            }
        });
    });
});

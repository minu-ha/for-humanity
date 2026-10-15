import {expect} from "@playwright/test";
import {test} from "@test/_fixture/navigation";
import {readNavigationScroll} from "@test/_fixture/read-navigation-scroll";

test.use({viewport: {width: 1920, height: 600}});

test.describe("문서 탐색", () => {
    test("[NAV-010] 화면 크기와 문서가 바뀌어도 위치와 포커스와 앵커를 유지한다", {tag: "@high"}, async ({page}) => {
        /**
         * GIVEN
         * 스크롤 가능한 문서 목록과 목차
         */
        const errors: string[] = [];
        const scriptRequests: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("request", (request) => {
            if (request.resourceType() === "script") scriptRequests.push(request.url());
        });
        await page.goto("/guide/");
        const documents = page.locator('[data-navigation-scroll="documents"]');
        const outline = page.locator('[data-navigation-scroll="outline"]');
        const cursor = page.locator("[data-cursor-face]");
        const navigation = page.locator("[data-navigation]");
        const details = page.locator("details");
        const hiddenHeading = page.locator("#hidden-detail .wg_prose__headingText");
        // 소수 높이와 scroll anchoring의 반올림만 허용
        const roundingTolerance = 1;
        await test.step("새로고침 첫 프레임부터 저장한 두 위치가 복원된다", async () => {
            /**
             * WHEN
             * 두 탐색 영역 스크롤 후 새로고침
             */
            await page.mouse.move(500, 200);
            await expect(cursor).toHaveCSS("visibility", "visible");
            await page.mouse.down();
            await page.mouse.up();
            await expect(cursor).toHaveCSS("visibility", "visible");
            await documents.evaluate((element) => {
                element.scrollTop = 200;
            });
            await outline.evaluate((element) => {
                element.scrollTop = 250;
            });
            await expect.poll(async () => (await readNavigationScroll(page))?.wide).toStrictEqual({documents: 200, outline: 250});
            // 외부 스크립트 없이 첫 프레임부터 저장 위치를 복원해야 한다.
            await page.addInitScript(() => {
                window.navigationFrames = [];
                let frames = 0;
                /**
                 * 최초 프레임부터 적용한 탐색 위치 수집
                 */
                const sample = () => {
                    const documents = document.querySelector<HTMLElement>('[data-navigation-scroll="documents"]');
                    const outline = document.querySelector<HTMLElement>('[data-navigation-scroll="outline"]');
                    if (documents && outline) window.navigationFrames.push({documents: documents.scrollTop, outline: outline.scrollTop});
                    if (++frames < 45) requestAnimationFrame(sample);
                };
                requestAnimationFrame(sample);
            });
            await page.reload();
            await page.waitForFunction(() => window.navigationFrames.length >= 10);
            /**
             * THEN
             * 첫 프레임부터 원위치와 커서 표시 유지
             */
            await expect(cursor).toHaveCSS("visibility", "visible");
            const frames = await page.evaluate(() => window.navigationFrames);
            for (const frame of frames) {
                expect(Math.abs(frame.documents - 200)).toBeLessThanOrEqual(roundingTolerance);
                expect(Math.abs(frame.outline - 250)).toBeLessThanOrEqual(roundingTolerance);
            }
        });
        await test.step("다른 문서는 목차만 초기화하고 해시의 하위 제목을 선택한다", async () => {
            await page.goto("/page-1/");
            expect(Math.abs((await documents.evaluate((element) => element.scrollTop)) - 200)).toBeLessThanOrEqual(roundingTolerance);
            await expect(outline).toHaveJSProperty("scrollTop", 0);
            await page.goto("/guide/#detail-10");
            await expect(page.locator('[aria-current="location"]')).toHaveAttribute("href", "#detail-10");
            await expect(page.locator('[aria-current="location"]')).toHaveCount(1);
            await expect(page.locator('a[href="#section-10"]')).not.toHaveAttribute("aria-current");
        });

        await test.step("배치를 전환해도 독립 스크롤과 포커스와 본문을 유지한다", async () => {
            await page.getByRole("link", {name: "Hidden detail", exact: true}).click();
            await expect(details).toHaveJSProperty("open", true);
            await expect(hiddenHeading).toHaveClass(/wg_prose__headingText--highlighted/);
            const body = await page.locator("main").elementHandle();
            await page.setViewportSize({width: 1280, height: 600});
            await expect(navigation).toHaveAttribute("data-navigation-layout", "desktop");
            await documents.evaluate((element) => {
                element.scrollTop = 80;
            });
            await expect.poll(async () => (await readNavigationScroll(page))?.desktop?.documents).toBe(80);
            const focused = page.getByRole("link", {name: "Page 10", exact: true});
            await focused.focus();
            const desktopPosition = await page.locator('[data-navigation-scroll="documents"]').evaluate((element) => element.scrollTop);
            await page.setViewportSize({width: 390, height: 844});
            await expect(page.getByRole("button", {name: "Open navigation", exact: true})).toBeFocused();
            await page.getByRole("button", {name: "Open navigation", exact: true}).click();
            await documents.evaluate((element) => {
                element.scrollTop = 180;
            });
            await expect.poll(async () => (await readNavigationScroll(page))?.drawer?.documents).toBe(180);
            await page.getByRole("link", {name: "Page 10", exact: true}).focus();
            await page.setViewportSize({width: 1280, height: 600});
            await expect(navigation).toHaveAttribute("data-navigation-layout", "desktop");
            await expect(focused).toBeFocused();
            await expect(documents).toHaveJSProperty("scrollTop", desktopPosition);
            await expect(page.locator("dialog")).toHaveJSProperty("open", false);
            expect(await body.evaluate((element) => element === document.querySelector<HTMLElement>("main"))).toBe(true);
        });
        await test.step("접힌 제목으로 이동하면 내용을 공개하고 강조를 정리한다", async () => {
            await page.setViewportSize({width: 1920, height: 600});
            await expect(navigation).toHaveAttribute("data-navigation-layout", "wide");
            await page.locator("details summary").click();
            await expect(details).toHaveJSProperty("open", false);
            await page.getByRole("link", {name: "Hidden detail", exact: true}).click();
            await expect(details).toHaveJSProperty("open", true);
            await expect(hiddenHeading).toHaveClass(/wg_prose__headingText--highlighted/);
            await expect(hiddenHeading).not.toHaveClass(/wg_prose__headingText--highlighted/);
        });
        expect(scriptRequests, "one inline entry must provide every browser behavior").toStrictEqual([]);
        expect(errors).toStrictEqual([]);
    });
    test.describe("움직임 줄이기", () => {
        test.use({reducedMotion: "reduce"});
        test("[NAV-011] 움직임 줄이기 설정에서는 커서 장식을 숨긴다", {tag: "@mid"}, async ({page}) => {
            /**
             * WHEN
             * 움직임 줄이기 환경에서 커서 이동
             */
            await page.goto("/guide/");
            await page.mouse.move(500, 200);
            /**
             * THEN
             * 커서 장식 미표시
             */
            await expect(page.locator("[data-cursor-face]")).toHaveCSS("visibility", "hidden");
        });
    });
    for (const storage of ["blocked", "corrupt"]) {
        test(`[NAV-${storage === "blocked" ? "012" : "013"}] 저장소 ${storage} 상태에서도 문서를 이동한다`, {tag: ["@high", "@negative"]}, async ({page}) => {
            /**
             * GIVEN
             * 차단되거나 손상된 브라우저 저장소
             */
            await page.addInitScript((mode) => {
                if (mode === "blocked") {
                    for (const key of ["localStorage", "sessionStorage"]) {
                        Object.defineProperty(window, key, {
                            get: () => {
                                throw new DOMException("Storage blocked", "SecurityError");
                            },
                        });
                    }
                } else {
                    sessionStorage.setItem("for-humanity:navigation-scroll", "{broken");
                }
            }, storage);
            const errors: string[] = [];
            page.on("pageerror", (error) => errors.push(error.message));
            /**
             * WHEN
             * 탐색 스크롤과 다른 문서로 이동
             */
            await page.goto("/guide/");
            await page.locator('[data-navigation-scroll="documents"]').evaluate((element) => {
                element.scrollTop = 120;
            });
            await page.getByRole("link", {name: "Page 10", exact: true}).click();
            /**
             * THEN
             * 예외 없이 선택한 문서 표시
             */
            await expect(page).toHaveURL(/\/page-10\/$/);
            expect(errors).toStrictEqual([]);
        });
    }
});

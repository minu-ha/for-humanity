import {expect} from "@playwright/test";
import {test} from "@test/_fixture/navigation";

test.use({viewport: {width: 1920, height: 600}});

test.describe("셸 컴포넌트 수명", () => {
    test("[NAV-014] 반복 마운트와 해제에서 구독과 타이머를 정리한다", {tag: "@high"}, async ({page}) => {
        /**
         * GIVEN
         * 전역 구독을 관찰하는 실제 셸
         */
        const errors: string[] = [];

        page.on("pageerror", (error) => errors.push(error.message));

        await page.addInitScript(() => {
            window.shellListeners = [];

            const add = EventTarget.prototype.addEventListener;
            const remove = EventTarget.prototype.removeEventListener;

            // DOM이 전달하는 this를 보존하는 계측 경계
            EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (this === window || this === document || this === document.documentElement || this instanceof MediaQueryList) {
                    const owned = new Error().stack?.includes(`${location.origin}/lifecycle/`) === true;

                    window.shellListeners.push({target: this, type, listener, options, removed: false, owned});
                }

                return add.call(this, type, listener, options);
            };

            EventTarget.prototype.removeEventListener = function (type, listener, options) {
                for (const entry of window.shellListeners) {
                    if (entry.target === this && entry.type === type && entry.listener === listener) {
                        entry.removed = true;
                    }
                }

                return remove.call(this, type, listener, options);
            };
        });

        await page.goto("/lifecycle/");

        const initialListeners = await page.evaluate(() => window.shellListeners.length);

        for (let cycle = 0; cycle < 3; cycle++) {
            await test.step(`${cycle + 1}번째 마운트에서 생성한 자원을 해제한다`, async () => {
                /**
                 * WHEN
                 * 셸 마운트와 앵커 강조 후 해제
                 */
                await page.evaluate(() => window.shellFixture.mount());
                await page.mouse.move(500, 200);
                await expect(page.locator("[data-cursor-face]")).toHaveCSS("visibility", "visible");

                await page.evaluate(() => {
                    location.hash = "#hidden-detail";
                    dispatchEvent(new HashChangeEvent("hashchange"));
                });

                await page.waitForFunction(() => {
                    return document.querySelector<HTMLElement>("#hidden-detail .wg_article__headingText")?.classList.contains("wg_article__headingText--highlighted");
                });

                const main = await page.locator("main").elementHandle();

                await page.evaluate(() => window.shellFixture.unmount());

                /**
                 * THEN
                 * 본문 유지와 구독, 타이머 정리
                 */
                expect(await main.evaluate((element) => element === document.querySelector<HTMLElement>("main"))).toBe(true);
                expect(await page.locator(".wg_article__headingText--highlighted").count()).toBe(0);

                const active = await page.evaluate((start) => {
                    return window.shellListeners
                        .slice(start)
                        .filter((entry) => entry.owned && !entry.removed && !(typeof entry.options === "object" && entry.options.signal?.aborted))
                        .map((entry) => entry.type);
                }, initialListeners);

                expect(active, "unmount must clean every global listener and pending highlight").toStrictEqual([]);
            });
        }

        // 첫 Effect frame 이전 해제에서도 늦은 구독 설치 방지
        await page.evaluate(() => {
            window.shellFixture.mount();
            window.shellFixture.unmount();
        });

        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        expect(errors).toStrictEqual([]);
    });
});

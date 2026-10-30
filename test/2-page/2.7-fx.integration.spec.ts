import {expect} from "@playwright/test";
import {test} from "@test/_fixture/fx";

/**
 * 그림 위젯(src/component/widget/fx/wg-fx.tsx) 검증. 갤러리에서 마운트한 위젯
 */
test.describe("그림", () => {
    test.describe("수명", () => {
        test("[FIG-013] 마운트하면 onEnhanced를 한 번 부르고 해제할 때는 부르지 않는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 위젯을 마운트하지 않은 갤러리 문서
             */
            await page.goto("/lifecycle/");

            await test.step("마운트하면 onEnhanced를 한 번 부른다", async () => {
                /**
                 * GIVEN
                 * onEnhanced 호출이 없는 문서
                 */
                expect(await page.evaluate(() => window.fxEnhanced)).toBe(0);

                /**
                 * WHEN
                 * 마운트
                 */
                await page.evaluate(() => window.fxFixture.mount());

                /**
                 * THEN
                 * 호출 한 번
                 */
                expect(await page.evaluate(() => window.fxEnhanced)).toBe(1);
            });

            await test.step("해제하면 onEnhanced를 다시 부르지 않는다", async () => {
                /**
                 * GIVEN
                 * 마운트한 위젯
                 */

                /**
                 * WHEN
                 * 해제
                 */
                await page.evaluate(() => window.fxFixture.unmount());

                /**
                 * THEN
                 * 호출 한 번 그대로
                 */
                expect(await page.evaluate(() => window.fxEnhanced)).toBe(1);
            });
        });

        test("[FIG-014] 위젯을 해제하면 조작부와 상태가 사라지고 재생이 멈추며 다시 마운트하면 1단계부터 붙는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 멈춘 가짜 시계, 갤러리에서 마운트하고 재생 중인 2단계 그림
             */
            await page.clock.install({time: 0});
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.fxFixture.mount());

            const figure = page.locator("#steps");
            const play = figure.locator(".fx__bar button").first();
            const replay = page.locator("#custom button");

            await expect(figure).toHaveAttribute("data-step", "1");
            await page.clock.pauseAt(60000);
            await play.click();
            await page.clock.runFor(500);
            await expect(figure).toHaveAttribute("data-step", "2");

            await test.step("해제하면 조작부, 단계 상태, 아이콘 버튼이 서버 HTML로 돌아오고 시간이 흘러도 그대로다", async () => {
                /**
                 * GIVEN
                 * 재생 중인 2단계 그림
                 */

                /**
                 * WHEN
                 * 위젯 해제 뒤 4초를 흘림
                 */
                await page.evaluate(() => window.fxFixture.unmount());
                await page.clock.runFor(4000);

                /**
                 * THEN
                 * 조작부, 상태, 캡션 접힘 없음. custom 버튼은 쓴 글자 그대로
                 */
                await expect(figure.locator(".fx__bar")).toHaveCount(0);
                await expect(figure).not.toHaveClass(/fx--ready/);
                await expect(figure).not.toHaveAttribute("data-step");
                await expect(figure.locator(".fx__captions > li").nth(2)).toBeVisible();
                await expect(page.locator("#from-two")).not.toHaveClass(/is-on/);
                await expect(page.locator("#run .wg_fx__out")).toHaveCount(0);
                await expect(replay).toHaveText("Replay");
                await expect(replay).not.toHaveClass(/wg_fx__icon/);
                await expect(replay).not.toHaveAttribute("aria-label");
            });

            await test.step("다시 마운트하면 1단계부터 조작부가 붙는다", async () => {
                /**
                 * GIVEN
                 * 해제한 그림
                 */

                /**
                 * WHEN
                 * 다시 마운트
                 */
                await page.evaluate(() => window.fxFixture.mount());

                /**
                 * THEN
                 * 1단계와 조작부 하나
                 */
                await expect(figure).toHaveAttribute("data-step", "1");
                await expect(figure.locator(".fx__bar")).toHaveCount(1);
            });
        });

        test("[FIG-015] 재생 중 fx:step 수신 측이 위젯을 해제하면 단계 표시가 사라지고 더 넘어가지 않는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 멈춘 가짜 시계, 갤러리에서 마운트한 단계 그림, 2단계를 받으면 위젯을 해제하고 그 뒤의 fx:step을 data-late에 세는 수신 측
             */
            await page.clock.install({time: 0});
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.fxFixture.mount());

            const figure = page.locator("#steps");
            const play = figure.locator(".fx__bar button").first();

            await expect(figure).toHaveAttribute("data-step", "1");
            await page.clock.pauseAt(60000);
            await figure.evaluate((root) => {
                root.addEventListener("fx:step", (event) => {
                    if (root.dataset.late !== undefined) {
                        root.dataset.late = String(Number(root.dataset.late) + 1);
                    } else if (event instanceof CustomEvent && event.detail.step === 2) {
                        root.dataset.late = "0";
                        window.fxFixture.unmount();
                    }
                });
            });

            /**
             * WHEN
             * 재생해 2단계에 닿은 뒤 5초를 더 흘림
             */
            await play.click();
            await page.clock.runFor(5500);

            /**
             * THEN
             * 해제 뒤 fx:step 없음, data-step 없음, 캡션 전체 표시
             */
            await expect(figure).toHaveAttribute("data-late", "0");
            await expect(figure).not.toHaveAttribute("data-step");
            await expect(figure.locator(".fx__captions > li").filter({visible: true})).toHaveCount(3);
        });
    });

    test.describe("문구", () => {
        test("[FIG-016] 페이지 언어가 ko면 조작부 문구가 한국어다", {tag: "@low"}, async ({page}) => {
            /**
             * GIVEN
             * lang을 ko로 바꾼 문서
             */
            await page.goto("/lifecycle/");
            await page.evaluate(() => {
                document.documentElement.lang = "ko";
            });

            const play = page.locator("#steps .fx__bar button").first();

            /**
             * WHEN
             * 마운트
             */
            await page.evaluate(() => window.fxFixture.mount());

            /**
             * THEN
             * 한국어 이름
             */
            await expect(play).toHaveAttribute("aria-label", "재생");
            await expect(page.locator("#run").getByRole("button", {name: "실행", exact: true})).toHaveCount(1);
        });
    });
});

import {expect} from "@playwright/test";
import {test} from "@test/_fixture/fx";

/**
 * 인터랙티브 그림(src/component/widget/fx) 검증. 실제 CLI 빌드 결과
 */
test.describe("그림", () => {
    test.describe("단계 재생", () => {
        test("[FIG-001] 조작부가 붙고 1단계에서 시작하며 다음과 이전이 요소, 형광펜, 위치, 캡션을 바꾼다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 빌드한 단계 그림의 조작부와 캡션
             */
            const figure = page.locator("#steps");
            const bar = figure.locator(".fx__bar");
            const next = bar.getByRole("button", {name: "Next step", exact: true});
            const previous = bar.getByRole("button", {name: "Previous step", exact: true});
            const counter = bar.locator(".wg_fx__count");
            const captions = figure.locator(".fx__captions > li");

            await test.step("문서를 열면 1단계의 요소와 첫 캡션만 보이고 이전 단계는 비활성이다", async () => {
                /**
                 * GIVEN
                 * 세 단계 그림이 있는 문서
                 */

                /**
                 * WHEN
                 * 문서 조회
                 */
                await page.goto("/figures/");

                /**
                 * THEN
                 * 1단계의 요소, 위치, 캡션, 처음 상태
                 */
                await expect(figure).toHaveClass(/fx--ready/);
                await expect(figure).toHaveAttribute("data-step", "1");
                await expect(counter).toHaveText("1 / 3");
                await expect(previous).toHaveAttribute("aria-disabled", "true");
                await expect(previous).toHaveClass(/wg_fx__icon--off/);
                await expect(next).toHaveAttribute("aria-disabled", "false");
                await expect(captions.nth(0)).toBeVisible();
                await expect(captions.nth(1)).toBeHidden();
                await expect(page.locator("#only-one")).toHaveClass(/is-on/);
                await expect(page.locator("#from-two")).not.toHaveClass(/is-on/);
                await expect(page.locator("#up-to-two")).toHaveClass(/is-on/);
                await expect(page.locator("#marked")).not.toHaveClass(/is-hl/);
                await expect(page.locator("#moved")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
            });

            await test.step("다음 단계를 두 번 누르면 3단계의 요소와 위치와 캡션이 되고 다음 단계는 비활성이다", async () => {
                /**
                 * GIVEN
                 * 1단계의 그림
                 */

                /**
                 * WHEN
                 * 다음 단계를 두 번 누름
                 */
                await next.click();
                await next.click();

                /**
                 * THEN
                 * 3단계의 요소, 위치, 캡션, 끝 상태
                 */
                await expect(figure).toHaveAttribute("data-step", "3");
                await expect(counter).toHaveText("3 / 3");
                await expect(next).toHaveAttribute("aria-disabled", "true");
                await expect(page.locator("#only-one")).not.toHaveClass(/is-on/);
                await expect(page.locator("#from-two")).toHaveClass(/is-on/);
                await expect(page.locator("#up-to-two")).not.toHaveClass(/is-on/);
                await expect(page.locator("#moved")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 40, 0)");
                await expect(captions.nth(2)).toBeVisible();
                await expect(captions.nth(0)).toBeHidden();
            });

            await test.step("이전 단계를 누르면 2단계의 형광펜과 캡션이 보인다", async () => {
                /**
                 * GIVEN
                 * 3단계의 그림
                 */

                /**
                 * WHEN
                 * 이전 단계 누름
                 */
                await previous.click();

                /**
                 * THEN
                 * 2단계, 형광펜, 둘째 캡션
                 */
                await expect(figure).toHaveAttribute("data-step", "2");
                await expect(previous).not.toHaveClass(/wg_fx__icon--off/);
                await expect(page.locator("#marked")).toHaveClass(/is-hl/);
                await expect(captions.nth(1)).toBeVisible();
            });
        });

        test("[FIG-002] 스크러버와 방향키로 단계를 옮긴다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 1단계의 단계 그림
             */
            await page.goto("/figures/");

            const figure = page.locator("#steps");
            const scrub = figure.getByRole("slider", {name: "Step"});

            /**
             * WHEN
             * 스크러버를 3으로 옮기고 왼쪽 방향키
             */
            await scrub.fill("3");
            await expect(figure).toHaveAttribute("data-step", "3");
            await figure.getByRole("button", {name: "Next step", exact: true}).focus();
            await page.keyboard.press("ArrowLeft");

            /**
             * THEN
             * 2단계와 스크러버 값
             */
            await expect(figure).toHaveAttribute("data-step", "2");
            await expect(scrub).toHaveValue("2");
        });

        test("[FIG-003] 재생은 0.5초 뒤 다음 단계로 가고 2초마다 넘기다 끝에서 멈춘다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 멈춘 가짜 시계와 1단계의 단계 그림
             */
            await page.clock.install({time: 0});
            await page.goto("/figures/");

            const figure = page.locator("#steps");
            const play = figure.locator(".fx__bar button").first();

            await expect(figure).toHaveAttribute("data-step", "1");
            await page.clock.pauseAt(60000);

            await test.step("재생을 누르면 0.5초 뒤 2단계, 그 2초 뒤 3단계로 가고 끝에서 멈춘다", async () => {
                /**
                 * GIVEN
                 * 1단계에서 멈춘 그림
                 */

                /**
                 * WHEN
                 * 재생을 누르고 각 전환 직전과 직후까지 시간을 흘림
                 */
                await play.click();
                await expect(play).toHaveAttribute("aria-label", "Pause");
                await page.clock.runFor(499);
                await expect(figure).toHaveAttribute("data-step", "1");
                await page.clock.runFor(1);
                await expect(figure).toHaveAttribute("data-step", "2");
                await page.clock.runFor(1999);
                await expect(figure).toHaveAttribute("data-step", "2");
                await page.clock.runFor(1);

                /**
                 * THEN
                 * 3단계와 재생 아이콘
                 */
                await expect(figure).toHaveAttribute("data-step", "3");
                await expect(play).toHaveAttribute("aria-label", "Play");
            });

            await test.step("끝에서 재생을 누르면 1단계부터 다시 재생한다", async () => {
                /**
                 * GIVEN
                 * 3단계에서 멈춘 그림
                 */

                /**
                 * WHEN
                 * 재생 누름
                 */
                await play.click();

                /**
                 * THEN
                 * 1단계와 멈춤 아이콘
                 */
                await expect(figure).toHaveAttribute("data-step", "1");
                await expect(play).toHaveAttribute("aria-label", "Pause");
            });

            await test.step("멈춤을 누르면 시간이 흘러도 그 단계에 머문다", async () => {
                /**
                 * GIVEN
                 * 1단계에서 재생 중인 그림
                 */

                /**
                 * WHEN
                 * 멈춤을 누르고 3초를 흘림
                 */
                await play.click();
                await page.clock.runFor(3000);

                /**
                 * THEN
                 * 재생 아이콘과 1단계 유지
                 */
                await expect(play).toHaveAttribute("aria-label", "Play");
                await expect(figure).toHaveAttribute("data-step", "1");
            });
        });

        test("[FIG-004] data-labels는 재생 조작부 대신 탭이고 누른 탭이 눌린 상태다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 탭 그림
             */
            await page.goto("/figures/");

            const figure = page.locator("#tabs");
            const before = figure.getByRole("button", {name: "Before", exact: true});
            const after = figure.getByRole("button", {name: "After", exact: true});

            await expect(figure.locator(".fx__bar button")).toHaveCount(2);
            await expect(figure.locator(".wg_fx__scrub")).toHaveCount(0);
            await expect(before).toHaveAttribute("aria-pressed", "true");

            /**
             * WHEN
             * After 탭
             */
            await after.click();

            /**
             * THEN
             * 2단계 요소와 눌린 탭
             */
            await expect(figure).toHaveAttribute("data-step", "2");
            await expect(after).toHaveAttribute("aria-pressed", "true");
            await expect(before).toHaveAttribute("aria-pressed", "false");
            await expect(figure.locator('[data-on="2"]')).toHaveClass(/is-on/);
        });

        test("[FIG-005] 작성자 스크립트는 fx:step을 받고 fx:goto로 처음부터 재생한다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 멈춘 가짜 시계와 3단계로 옮긴 스크립트 그림
             */
            await page.clock.install({time: 0});
            await page.goto("/figures/");

            const figure = page.locator("#scripted");
            const play = figure.locator(".fx__bar button").first();
            const out = page.locator("#scripted-out");

            await expect(out).toHaveText("step 1");
            await page.clock.pauseAt(60000);
            await figure.getByRole("slider", {name: "Step"}).fill("3");
            await expect(out).toHaveText("step 3");

            /**
             * WHEN
             * 그림의 Replay 버튼이 fx:goto {step: 1, play: true}를 보낸 뒤 2초를 흘림
             */
            await figure.getByRole("button", {name: "Replay", exact: true}).click();
            await expect(play).toHaveAttribute("aria-label", "Pause");
            await page.clock.runFor(1900);
            await expect(out).toHaveText("step 1");
            await page.clock.runFor(100);

            /**
             * THEN
             * 1단계가 2초 보인 뒤 2단계
             */
            await expect(out).toHaveText("step 2");
        });

        test("[FIG-006] fx:step 수신 측이 재생 중에 fx:goto로 다시 재생해도 멈춤을 누르면 그 단계에 머문다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 멈춘 가짜 시계와 2단계를 처음 받으면 fx:goto {step: 2, play: true}를 보내는 단계 그림
             */
            await page.clock.install({time: 0});
            await page.goto("/figures/");

            const figure = page.locator("#steps");
            const play = figure.locator(".fx__bar button").first();

            await expect(figure).toHaveAttribute("data-step", "1");
            await page.clock.pauseAt(60000);
            await figure.evaluate((root) => {
                root.addEventListener("fx:step", (event) => {
                    if (root.dataset.replayed === undefined && event instanceof CustomEvent && event.detail.step === 2) {
                        root.dataset.replayed = "true";
                        root.dispatchEvent(new CustomEvent("fx:goto", {detail: {step: 2, play: true}}));
                    }
                });
            });

            /**
             * WHEN
             * 재생해 2단계로 넘어간 뒤 멈춤을 누르고 시간을 흘림
             */
            await play.click();
            await page.clock.runFor(500);
            await expect(figure).toHaveAttribute("data-step", "2");
            await expect(play).toHaveAttribute("aria-label", "Pause");
            await play.click();
            await page.clock.runFor(10000);

            /**
             * THEN
             * 수신 측의 다시 재생, 재생 아이콘, 2단계 유지
             */
            await expect(figure).toHaveAttribute("data-replayed", "true");
            await expect(play).toHaveAttribute("aria-label", "Play");
            await expect(figure).toHaveAttribute("data-step", "2");
        });
    });

    test.describe("다른 그림 종류", () => {
        test("[FIG-007] 슬라이더 값이 --fx-v, data-value, output, fx:input에 반영된다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * min 0, max 10, value 5인 슬라이더와 fx:input 수신
             */
            await page.goto("/figures/");

            const figure = page.locator("#range");
            const input = figure.locator("input[type=range]");

            await expect(figure).toHaveAttribute("data-value", "5");
            await expect(figure.locator("output")).toHaveText("5px");

            const received = page.evaluate(() => {
                return new Promise<number>((resolve) => {
                    document
                        .getElementById("range")
                        ?.addEventListener("fx:input", (event) => resolve(event instanceof CustomEvent ? event.detail.ratio : Number.NaN), {once: true});
                });
            });

            /**
             * WHEN
             * 값을 10으로
             */
            await input.fill("10");

            /**
             * THEN
             * 비율 1, data-value, 단위를 붙인 output
             */
            expect(await received).toBe(1);
            await expect(figure).toHaveAttribute("data-value", "10");
            await expect(figure.locator("output")).toHaveText("10px");
            expect(await figure.evaluate((element) => element.style.getPropertyValue("--fx-v"))).toBe("1");
        });

        test("[FIG-008] 실행 상자는 앞 코드 블록을 sandbox에서 돌려 콘솔과 오류를 보이고 고친 코드도 돌린다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 콘솔 두 줄과 오류 한 줄을 내는 코드 블록 아래 실행 상자
             */
            await page.goto("/figures/");

            const figure = page.locator("#run");
            const output = figure.locator(".wg_fx__out");
            const frame = page.locator('iframe[sandbox="allow-scripts"]');
            const code = figure.getByRole("textbox", {name: "Code to run"});

            await expect(figure).toHaveClass(/fx--ready/);

            await test.step("실행하면 콘솔 두 줄과 잡히지 않은 오류를 보이고 iframe을 치운다", async () => {
                /**
                 * GIVEN
                 * 빈 출력
                 */
                await expect(output).toHaveText("");

                /**
                 * WHEN
                 * 실행
                 */
                await figure.getByRole("button", {name: "Run", exact: true}).click();

                /**
                 * THEN
                 * 두 줄의 콘솔, script 문자열 그대로, 잡히지 않은 오류, 대기 뒤 iframe 제거
                 */
                await expect(output).toContainText("hello 2");
                await expect(output).toContainText('{"a":1} </script>');
                await expect(output).toContainText("Uncaught");
                await expect(frame).toHaveCount(1);
                await expect(frame).toHaveCount(0);
            });

            await test.step("고친 코드를 실행하면 그 코드의 출력만 보인다", async () => {
                /**
                 * GIVEN
                 * 첫 실행을 마친 상자
                 */

                /**
                 * WHEN
                 * 코드 고치기를 열고 한 줄로 바꿔 실행
                 */
                await figure.getByRole("button", {name: "Edit code", exact: true}).click();
                await code.fill('console.log("edited")');
                await figure.getByRole("button", {name: "Run", exact: true}).click();

                /**
                 * THEN
                 * 고친 코드의 출력
                 */
                await expect(output).toHaveText("edited\n");
            });

            await test.step("처음 코드로 되돌리면 출력과 iframe이 사라지고 원래 코드가 돌아온다", async () => {
                /**
                 * GIVEN
                 * 고친 코드를 실행한 상자
                 */

                /**
                 * WHEN
                 * 처음 코드로 누름
                 */
                await figure.getByRole("button", {name: "Reset code", exact: true}).click();

                /**
                 * THEN
                 * 빈 출력, iframe 없음, 코드 블록 그대로의 코드
                 */
                await expect(output).toHaveText("");
                await expect(frame).toHaveCount(0);
                await expect(code).toHaveValue('console.log("hello", 1 + 1);\nconsole.log({a: 1}, "</script>");\nmissing.x;');
            });
        });

        test("[FIG-009] custom 그림의 data-icon 버튼은 아이콘과 이름으로 바뀌고 작성자 조작부는 그대로다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 작성자가 fx__bar와 data-icon 버튼을 둔 custom 그림
             */
            const figure = page.locator("#custom");
            const button = figure.getByRole("button", {name: "Replay", exact: true});

            /**
             * WHEN
             * 문서 조회
             */
            await page.goto("/figures/");

            /**
             * THEN
             * 아이콘 SVG, aria-label, data-tip, 조작부 하나
             */
            await expect(button).toHaveClass(/wg_fx__icon/);
            await expect(button.locator("svg")).toHaveCount(1);
            await expect(button).toHaveAttribute("data-tip", "Replay");
            await expect(figure.locator(".fx__bar")).toHaveCount(1);
            await expect(figure.locator(".wg_fx__scrub")).toHaveCount(0);
        });
    });

    test.describe("문서 진입", () => {
        test("[FIG-010] 그림 아래 제목으로 들어오면 조작부가 붙은 뒤에도 제목이 스크롤 여백 위치에 있다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 그림 여섯 개 아래, 화면보다 긴 본문 위의 제목 hash
             */

            /**
             * WHEN
             * hash로 진입하고 조작부가 붙기를 기다림
             */
            await page.goto("/figures/#after");
            await expect(page.locator("#steps .fx__bar")).toHaveCount(1);

            /**
             * THEN
             * 제목의 스크롤 여백에 맞춘 위치
             */
            await expect
                .poll(() => {
                    return page
                        .locator("#after")
                        .evaluate((element) => Math.abs(element.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(element).scrollMarginTop)));
                })
                .toBeLessThanOrEqual(2);
        });

        test("[FIG-011] 그림이 없는 페이지는 바뀌지 않고 오류가 없다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 그림 없는 문서
             */
            const errors: string[] = [];

            page.on("pageerror", (error) => errors.push(error.message));

            /**
             * WHEN
             * 조회
             */
            await page.goto("/plain/");

            /**
             * THEN
             * fx 요소 없음, 오류 없음
             */
            await expect(page.getByRole("heading", {name: "Plain"})).toBeVisible();
            await expect(page.locator(".fx--ready, .fx__bar")).toHaveCount(0);
            expect(errors).toStrictEqual([]);
        });
    });

    test.describe("스크립트 없음", () => {
        test.use({javaScriptEnabled: false});

        test("[FIG-012] 끝까지 가는 요소와 캡션 전체가 보이고 조작부가 없다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * JavaScript를 끈 브라우저의 단계 그림
             */
            const figure = page.locator("#steps");

            /**
             * WHEN
             * 그림 문서 조회
             */
            await page.goto("/figures/");

            /**
             * THEN
             * 서버 HTML 그대로
             */
            await expect(figure).not.toHaveClass(/fx--ready/);
            await expect(figure.locator(".fx__bar")).toHaveCount(0);
            await expect(figure.locator(".fx__captions > li")).toHaveCount(3);
            await expect(figure.locator(".fx__captions > li").nth(2)).toBeVisible();
            await expect(page.locator("#from-two")).toHaveCSS("opacity", "1");
            await expect(page.locator("#only-one")).toHaveCSS("opacity", "0");
        });
    });
});

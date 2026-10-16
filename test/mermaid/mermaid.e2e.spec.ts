import {expect} from "@playwright/test";
import {test} from "@test/_fixture/mermaid";
import {diagram_cases} from "@test/mermaid/_constant/diagram";

test.describe("다이어그램", () => {
    test.describe("공식 문법", () => {
        for (const diagram of diagram_cases) {
            test(`[${diagram.caseId}] ${diagram.name} 문서는 공식 SVG와 원문을 유지한다`, {tag: "@high"}, async ({page}) => {
                /**
                 * GIVEN
                 * 실제 CLI로 빌드한 다이어그램 문서
                 */
                await page.goto(`/${diagram.id}/`);

                /**
                 * THEN
                 * 격리된 공식 SVG와 숨겨진 원문
                 */
                await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(1);
                await expect(page.locator(".wg_mermaid__result svg")).toContainText(diagram.label);
                await expect(page.locator(".wg_mermaid__result svg")).toHaveAttribute("role", /document/);
                await expect(page.locator("[data-mermaid-source]")).toHaveText(diagram.source);
                await expect(page.locator(".wg_mermaid__source")).toBeHidden();
                await expect(page.locator(".wg_mermaid__result")).toHaveJSProperty("textContent", "");
                await expect(page.locator('[data-mermaid-status="error"]')).toHaveCount(0);
            });
        }
    });

    test.describe("문서 진입과 자원", () => {
        test("[MRM-009] 다이어그램이 없는 페이지는 모듈을 요청하지 않는다", {tag: "@high"}, async ({page, runtime}) => {
            /**
             * GIVEN
             * 일반 문서 홈
             */
            await page.goto("/");
            await expect(page.getByRole("heading", {name: "Home", exact: true})).toBeVisible();

            /**
             * THEN
             * 다이어그램 자원 요청 없음
             */
            expect(runtime.requests.filter((url) => url.includes("/_fh/mermaid/"))).toStrictEqual([]);
        });

        test("[MRM-010] 접힌 다이어그램을 열면 모듈을 요청하고 표시한다", {tag: "@high"}, async ({page, runtime}) => {
            /**
             * GIVEN
             * 접힌 다이어그램만 있는 문서
             */
            await page.goto("/hidden/");
            await expect(page.getByText("Hidden diagram", {exact: true})).toBeVisible();
            expect(runtime.requests.filter((url) => url.includes("/_fh/mermaid/"))).toStrictEqual([]);

            /**
             * WHEN
             * 접힌 다이어그램 공개
             */
            await page.getByText("Hidden diagram", {exact: true}).click();

            /**
             * THEN
             * 모듈 수신과 정상 크기의 SVG 표시
             */
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(1);
            await expect(page.locator(".wg_mermaid__result svg")).toBeVisible();
            expect(runtime.requests.some((url) => url.includes("/_fh/mermaid/"))).toBe(true);
        });

        test("[MRM-011] 다이어그램 렌더 후에도 직접 연 제목의 위치가 유지된다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 여러 다이어그램 아래 제목으로 진입한 문서
             */
            await page.goto("/guide/#diagram-7");
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);

            /**
             * THEN
             * 제목의 스크롤 여백에 맞춘 초기 위치
             */
            await expect
                .poll(() => {
                    return page
                        .locator("#diagram-7")
                        .evaluate((element) => Math.abs(element.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(element).scrollMarginTop)));
                })
                .toBeLessThanOrEqual(2);
        });

        test("[MRM-012] 모바일 문서에 가로 스크롤이 생기지 않는다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 모바일 크기로 연 다이어그램 문서
             */
            await page.setViewportSize({width: 390, height: 844});
            await page.goto("/guide/");
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);

            /**
             * THEN
             * 문서 폭 안의 다이어그램
             */
            expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
        });

        test("[MRM-013] 렌더 자원은 모두 문서 서버에서 수신한다", {tag: "@high"}, async ({page, runtime, baseURL}) => {
            /**
             * GIVEN
             * 여러 공식 문법을 함께 표시하는 문서
             */
            await page.goto("/guide/");
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);

            /**
             * THEN
             * 외부 자원 요청과 실행 오류 없음
             */
            expect(runtime.requests.every((url) => new URL(url).origin === baseURL)).toBe(true);
            expect(runtime.errors).toStrictEqual([]);
            expect(runtime.consoleErrors).toStrictEqual([]);
        });
    });

    test.describe("실패 대체 표시", () => {
        test("[MRM-014] 모듈 수신에 실패하면 안내와 원문을 표시한다", {tag: ["@high", "@negative"]}, async ({page}) => {
            /**
             * GIVEN
             * 모듈 요청이 실패하는 문서
             */
            await page.route("**/_fh/mermaid/**", (route) => route.abort());
            await page.goto("/flowchart/");

            /**
             * THEN
             * 원문 유지와 수신 실패 안내
             */
            await expect(page.locator(".wg_mermaid__error")).toBeVisible();
            await expect(page.locator(".wg_mermaid__source")).toBeVisible();
            await expect(page.locator("[data-mermaid-source]")).toHaveText(diagram_cases[0].source);
            await expect(page.locator(".wg_mermaid__result svg")).toHaveCount(0);
        });

        test("[MRM-015] 잘못된 문법과 길이 초과는 다른 다이어그램의 표시를 막지 않는다", {tag: ["@high", "@negative"]}, async ({page, runtime}) => {
            /**
             * GIVEN
             * 잘못된 문법과 정상 다이어그램과 길이 초과 원문
             */
            await page.goto("/error/");

            /**
             * THEN
             * 개별 실패 안내와 정상 다이어그램 유지
             */
            await expect(page.locator('[data-mermaid-status="error"]')).toHaveCount(2);
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(1);
            await expect(page.locator(".wg_mermaid__error").first()).toContainText("원문");
            await expect(page.locator(".wg_mermaid__source").first()).toBeVisible();
            await expect(page.locator(".wg_mermaid__source").nth(2)).toBeVisible();
            await expect(page.locator(".wg_mermaid__measurement")).toHaveCount(0);
            expect(await page.evaluate(() => window.mermaidInjected)).toBeUndefined();
            expect(runtime.errors).toStrictEqual([]);
            expect(runtime.consoleErrors.filter((message) => message.includes("for-humanity Mermaid rendering failed"))).toHaveLength(2);
        });

        test.describe("스크립트 비활성", () => {
            test.use({javaScriptEnabled: false});

            test("[MRM-016] 스크립트를 비활성화해도 원문을 읽을 수 있다", {tag: "@high"}, async ({page}) => {
                /**
                 * GIVEN
                 * 스크립트 없이 연 다이어그램 문서
                 */
                await page.goto("/flowchart/");

                /**
                 * THEN
                 * 서버가 작성한 원문 표시
                 */
                await expect(page.locator("[data-mermaid-source]")).toHaveText(diagram_cases[0].source);
                await expect(page.locator(".wg_mermaid__source")).toBeVisible();
                await expect(page.locator(".wg_mermaid__result")).toBeHidden();
            });
        });
    });
});

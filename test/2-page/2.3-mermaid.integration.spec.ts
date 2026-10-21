import {expect} from "@playwright/test";
import {diagram_cases} from "@test/_constant/diagram";
import {test} from "@test/_fixture/mermaid";

/**
 * 다이어그램 위젯(src/component/widget/mermaid/wg-mermaid.tsx) 검증. 갤러리에서 마운트한 위젯
 */
test.describe("다이어그램", () => {
    test.describe("표현과 상호작용", () => {
        test("[MRM-017] 시스템 테마를 변경해도 작성자 테마와 파일 트리의 가독성이 유지된다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 밝은 테마에서 마운트한 다이어그램 위젯
             */
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.diagramFixture.mount());
            await expect(page.locator('[data-mermaid-theme="light"]')).toHaveCount(diagram_cases.length);

            const node = page.locator(".wg_mermaid__result").first().locator(".node rect").first();
            const authoredNode = page.locator(".wg_mermaid__result").nth(7).locator(".node rect").first();
            const light = await node.evaluate((element) => getComputedStyle(element).fill);
            const authored = await authoredNode.evaluate((element) => getComputedStyle(element).fill);

            /**
             * WHEN
             * 시스템 테마를 어두운 테마로 변경
             */
            await page.emulateMedia({colorScheme: "dark"});

            /**
             * THEN
             * 공식 어두운 팔레트, 작성자 테마, 읽을 수 있는 파일 트리
             */
            await expect(page.locator('[data-mermaid-theme="dark"]')).toHaveCount(diagram_cases.length);
            await expect(node).not.toHaveCSS("fill", light);
            await expect(authoredNode).toHaveCSS("fill", authored);

            expect(
                await page
                    .locator(".treeView-node-label")
                    .first()
                    .evaluate((label) => {
                        /**
                         * CSS 색의 상대 휘도. WCAG 대비 계산 기준
                         */
                        const toLuminance = (color: string) => {
                            const channels = color.match(/[\d.]+/g);

                            if (channels === null) {
                                throw new Error(`지원하지 않는 색 형식입니다: ${color}`);
                            }

                            return channels
                                .slice(0, 3)
                                .map((value) => Number(value) / 255)
                                .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
                                .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
                        };

                        const foreground = toLuminance(getComputedStyle(label).fill);
                        const background = toLuminance(getComputedStyle(document.documentElement).backgroundColor);

                        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
                    }),
            ).toBeGreaterThanOrEqual(4.5);
        });

        test("[MRM-018] 다른 다이어그램을 펼친 뒤에도 기존 툴팁이 표시된다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 렌더가 끝난 다이어그램과 닫힌 Details
             */
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.diagramFixture.mount());
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);

            await test.step("노드를 가리키면 툴팁이 표시된다", async () => {
                /**
                 * GIVEN
                 * 포인터를 올리기 전의 다이어그램 노드
                 */

                /**
                 * WHEN
                 * 첫 다이어그램 노드로 포인터 이동
                 */
                await page.locator(".wg_mermaid__result").first().locator(".node").first().hover();

                /**
                 * THEN
                 * 노드의 툴팁 표시
                 */
                await expect(page.locator(".mermaidTooltip")).toHaveText("Tooltip text");
                await expect(page.locator(".mermaidTooltip")).not.toHaveCSS("opacity", "0");
            });

            await test.step("노드에서 벗어나면 툴팁이 숨겨진다", async () => {
                /**
                 * GIVEN
                 * 툴팁을 표시한 다이어그램 노드
                 */

                /**
                 * WHEN
                 * 노드 밖 제목으로 포인터 이동
                 */
                await page.getByRole("heading", {name: "Guide", exact: true}).hover();

                /**
                 * THEN
                 * 툴팁 미표시
                 */
                await expect(page.locator(".mermaidTooltip")).toBeHidden();
            });

            await test.step("접힌 다이어그램을 열어도 기존 툴팁이 다시 표시된다", async () => {
                /**
                 * GIVEN
                 * 툴팁이 숨겨진 다이어그램과 닫힌 Details
                 */

                /**
                 * WHEN
                 * 접힌 다이어그램 공개와 렌더 대기 뒤 기존 노드로 포인터 이동
                 */
                await page.getByText("Hidden diagram", {exact: true}).click();
                await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length + 1);
                await page.locator(".wg_mermaid__result").first().locator(".node").first().hover();

                /**
                 * THEN
                 * 기존 노드의 툴팁 다시 표시
                 */
                await expect(page.locator(".mermaidTooltip")).toHaveText("Tooltip text");
                await expect(page.locator(".mermaidTooltip")).not.toHaveCSS("opacity", "0");
            });
        });
    });

    test.describe("컴포넌트 수명", () => {
        test("[MRM-023] 렌더 응답 대기 중 재마운트하면 이전 결과가 새 SVG를 덮지 않는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 실제 Mermaid 렌더의 첫 응답이 지연된 위젯
             */
            await page.goto("/lifecycle/");

            await page.evaluate(async () => {
                const path = document.querySelector<HTMLElement>("[data-mermaid-module]")?.dataset.mermaidModule;

                if (path === undefined) {
                    throw new Error("테스트 Mermaid 모듈이 없습니다");
                }

                const library: typeof import("mermaid") = await import(path);
                const original = library.default.render;
                const gate = Promise.withResolvers<void>();
                const completion = Promise.withResolvers<void>();
                let held = false;

                window.diagramRender = {waiting: false, release: gate.resolve, completion: completion.promise};

                library.default.render = async (...args: Parameters<typeof original>) => {
                    const rendered = await original(...args);

                    if (!held) {
                        held = true;
                        window.diagramRender.waiting = true;
                        await gate.promise;
                        library.default.render = original;
                        completion.resolve();
                    }

                    return rendered;
                };
            });

            await page.evaluate(() => window.diagramFixture.mount());
            await expect.poll(() => page.evaluate(() => window.diagramRender.waiting)).toBe(true);

            try {
                await test.step("지연 응답 전에 다시 마운트하면 늦은 결과가 새 SVG를 덮지 않는다", async () => {
                    /**
                     * GIVEN
                     * 첫 렌더 응답을 기다리는 위젯
                     */

                    /**
                     * WHEN
                     * 이전 응답 전에 해제하고 다시 마운트한 뒤 지연 응답 완료
                     */
                    await page.evaluate(() => {
                        window.diagramFixture.unmount();
                        window.diagramFixture.mount();
                    });

                    await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);

                    const currentId = await page.locator(".wg_mermaid__result svg").first().getAttribute("id");

                    if (currentId === null) {
                        throw new Error("새 SVG의 식별자가 없습니다");
                    }

                    await page.evaluate(() => window.diagramRender.release());

                    await page.evaluate(async () => {
                        await window.diagramRender.completion;
                        await new Promise(requestAnimationFrame);
                    });

                    /**
                     * THEN
                     * 새 위젯의 다이어그램 유지, 이전 측정 영역 제거
                     */
                    await expect(page.locator(".wg_mermaid__result svg").first()).toHaveAttribute("id", currentId);
                    await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);
                    await expect(page.locator(".wg_mermaid__measurement")).toHaveCount(0);
                });

                await test.step("다시 마운트한 위젯의 노드를 가리키면 툴팁이 표시된다", async () => {
                    /**
                     * GIVEN
                     * 지연 응답 뒤에도 유지한 새 다이어그램
                     */

                    /**
                     * WHEN
                     * 첫 다이어그램 노드로 포인터 이동
                     */
                    await page.locator(".wg_mermaid__result").first().locator(".node").first().hover();

                    /**
                     * THEN
                     * 새 위젯의 툴팁 표시
                     */
                    await expect(page.locator(".mermaidTooltip")).toHaveText("Tooltip text");
                });

                await test.step("다시 마운트한 위젯을 해제하면 SVG와 툴팁을 정리한다", async () => {
                    /**
                     * GIVEN
                     * 툴팁을 표시한 새 위젯
                     */

                    /**
                     * WHEN
                     * 위젯 해제
                     */
                    await page.evaluate(() => window.diagramFixture.unmount());

                    /**
                     * THEN
                     * SVG와 툴팁 제거
                     */
                    await expect(page.locator(".wg_mermaid__result svg")).toHaveCount(0);
                    await expect(page.locator(".mermaidTooltip")).toHaveCount(0);
                });
            } finally {
                await page.evaluate(() => window.diagramRender.release());
            }
        });

        test("[MRM-022] 모듈 수신에 실패한 위젯을 해제하면 오류 안내도 정리한다", {tag: ["@high", "@negative"]}, async ({page}) => {
            /**
             * GIVEN
             * 모듈 수신이 차단된 위젯
             */
            await page.route("**/_fh/mermaid/mermaid-*.js", (route) => route.abort());
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.diagramFixture.mount());
            await expect(page.locator(".wg_mermaid__error").first()).toBeVisible();

            /**
             * WHEN
             * 실패한 위젯 해제
             */
            await page.evaluate(() => window.diagramFixture.unmount());

            /**
             * THEN
             * 오류 안내 정리와 원문 유지
             */
            await expect(page.locator(".wg_mermaid__error").first()).toBeHidden();
            await expect(page.locator(".wg_mermaid__source").first()).toBeVisible();
            await expect(page.locator(".wg_mermaid__result svg")).toHaveCount(0);
        });

        test("[MRM-019] 모듈 수신 중 해제한 위젯은 늦게 도착한 결과를 적용하지 않는다", {tag: ["@high", "@negative"]}, async ({page}) => {
            /**
             * GIVEN
             * 진입 모듈의 응답이 지연된 위젯
             */
            const gate = Promise.withResolvers<void>();

            await page.route("**/_fh/mermaid/mermaid-*.js", async (route) => {
                await gate.promise;
                await route.continue();
            });

            await page.goto("/lifecycle/");

            const loading = page.waitForRequest("**/_fh/mermaid/mermaid-*.js");

            await page.evaluate(() => window.diagramFixture.mount());
            await loading;

            /**
             * WHEN
             * 응답 전에 위젯 해제 후 지연 응답 완료
             */
            try {
                await page.evaluate(() => window.diagramFixture.unmount());
            } finally {
                gate.resolve();
            }

            await page.evaluate(async () => {
                const path = document.querySelector<HTMLElement>("[data-mermaid-module]")?.dataset.mermaidModule;

                if (path === undefined) {
                    throw new Error("테스트 Mermaid 모듈이 없습니다");
                }

                await import(path);
                await new Promise(requestAnimationFrame);
            });

            /**
             * THEN
             * 늦은 SVG, 측정 요소, 툴팁 없음
             */
            await expect(page.locator(".wg_mermaid__result svg")).toHaveCount(0);
            await expect(page.locator(".wg_mermaid__measurement")).toHaveCount(0);
            await expect(page.locator(".mermaidTooltip")).toHaveCount(0);
            await expect(page.locator(".wg_mermaid__source").first()).toBeVisible();
        });

        test("[MRM-020] 해제한 위젯은 SVG와 툴팁을 정리하고 테마와 Details 변경에 반응하지 않는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 툴팁을 표시 중인 다이어그램 위젯
             */
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.diagramFixture.mount());
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);
            await page.locator(".wg_mermaid__result").first().locator(".node").first().hover();
            await expect(page.locator(".mermaidTooltip")).not.toHaveCSS("opacity", "0");

            /**
             * WHEN
             * 위젯 해제 후 시스템 테마 변경과 Details 공개
             */
            await page.evaluate(() => window.diagramFixture.unmount());
            await page.emulateMedia({colorScheme: "dark"});
            await page.getByText("Hidden diagram", {exact: true}).click();

            /**
             * THEN
             * 원문 복원과 이벤트 처리 중단
             */
            await expect(page.locator(".mermaidTooltip")).toHaveCount(0);
            await expect(page.locator(".wg_mermaid__result svg")).toHaveCount(0);
            await expect(page.locator(".wg_mermaid__measurement")).toHaveCount(0);
            await expect(page.locator("[data-mermaid-theme]")).toHaveCount(0);
            await expect(page.locator(".wg_mermaid__source").first()).toBeVisible();
        });

        test("[MRM-021] 해제한 위젯을 다시 마운트하면 다이어그램과 툴팁이 표시된다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 정상 렌더 후 해제한 다이어그램 위젯
             */
            await page.goto("/lifecycle/");
            await page.evaluate(() => window.diagramFixture.mount());
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);
            await page.evaluate(() => window.diagramFixture.unmount());

            /**
             * WHEN
             * 같은 위젯 다시 마운트
             */
            await page.evaluate(() => window.diagramFixture.mount());
            await page.locator(".wg_mermaid__result").first().locator(".node").first().hover();

            /**
             * THEN
             * 정상 SVG와 새 위젯이 관리하는 툴팁
             */
            await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(diagram_cases.length);
            await expect(page.locator(".mermaidTooltip")).toHaveText("Tooltip text");
            await expect(page.locator(".mermaidTooltip")).not.toHaveCSS("opacity", "0");
            await expect(page.locator(".wg_mermaid__measurement")).toHaveCount(0);
        });
    });
});

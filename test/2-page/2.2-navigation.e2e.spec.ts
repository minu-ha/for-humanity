import type {BrowserContextOptions, ViewportSize} from "@playwright/test";
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/navigation";
import {readNavigationScroll} from "@test/_fixture/read-navigation-scroll";
import {storage_scroll_key} from "@/store/navigation/_constant/storage";

/**
 * 탐색 배치 검사 한 건
 */
interface LayoutCase {
    /**
     * 케이스 번호
     */
    caseId: string;

    /**
     * 화면 크기와 표시 환경의 이름
     */
    name: string;

    /**
     * 브라우저 컨텍스트의 화면, 테마, 입력, 스크립트 설정
     */
    options: BrowserContextOptions & {viewport: ViewportSize};
}

/**
 * 배치 경계 1360px, 1024px의 양쪽과 휴대폰, 어두운 테마, 강제 색상, 스크립트 없음
 */
const navigation_layouts: LayoutCase[] = [
    {caseId: "NAV-001", name: "와이드 1920px", options: {viewport: {width: 1920, height: 600}}},
    {caseId: "NAV-002", name: "와이드 경계 1360px 어두운 테마", options: {viewport: {width: 1360, height: 600}, colorScheme: "dark"}},
    {caseId: "NAV-003", name: "데스크톱 1359px", options: {viewport: {width: 1359, height: 600}}},
    {caseId: "NAV-004", name: "데스크톱 경계 1024px", options: {viewport: {width: 1024, height: 600}}},
    {caseId: "NAV-005", name: "모바일 1023px", options: {viewport: {width: 1023, height: 600}}},
    {caseId: "NAV-006", name: "휴대폰 390px 터치", options: {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}},
    {caseId: "NAV-007", name: "강제 색상 1360px", options: {viewport: {width: 1360, height: 600}, forcedColors: "active"}},
    {caseId: "NAV-008", name: "휴대폰 390px 스크립트 없음", options: {viewport: {width: 390, height: 844}, javaScriptEnabled: false}},
    {caseId: "NAV-009", name: "와이드 1360px 스크립트 없음", options: {viewport: {width: 1360, height: 600}, javaScriptEnabled: false}},
];

test.use({viewport: {width: 1920, height: 600}});

/**
 * 문서 탐색 화면(src/component/widget/sidebar, src/component/widget/shell-controls, src/component/widget/cursor-face) 검증
 */
test.describe("문서 탐색", () => {
    for (const layout of navigation_layouts) {
        test.describe(`레이아웃 ${layout.name}`, () => {
            test.use(layout.options);

            test(`[${layout.caseId}] 화면 크기와 표시 환경에 맞는 탐색을 제공한다`, {tag: "@high"}, async ({page}) => {
                /**
                 * GIVEN
                 * 화면 크기와 시스템 표시 환경, 페이지 오류 기록
                 */
                const errors: string[] = [];
                const documents = page.locator('[data-sidebar-scroll="documents"]');
                const hasDrawer = layout.options.viewport.width < 1024 && layout.options.javaScriptEnabled !== false;

                page.on("pageerror", (error) => errors.push(error.message));

                await test.step("문서를 열면 화면 크기와 표시 환경에 맞게 탐색을 배치한다", async () => {
                    /**
                     * GIVEN
                     * 문서를 열기 전의 빈 페이지
                     */

                    /**
                     * WHEN
                     * 문서 조회와 모바일 탐색 공개
                     */
                    await page.goto("/guide/");

                    if (hasDrawer) {
                        await page.getByRole("button", {name: "Open navigation", exact: true}).click();
                    }

                    /**
                     * THEN
                     * 수평 넘침 없는 문서와 화면별 탐색 배치
                     */
                    if (hasDrawer) {
                        expect(await page.getByRole("dialog", {name: "Navigation", exact: true}).evaluate((element) => element.matches(":modal"))).toBe(true);
                    }

                    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
                    await expect(page.getByRole("navigation", {name: "On this page", exact: true})).toBeVisible({visible: layout.options.viewport.width >= 1360});

                    if (layout.options.javaScriptEnabled === false) {
                        await expect(page.getByRole("link", {name: "Child", exact: true})).toBeVisible();
                        expect(await documents.evaluate((element) => getComputedStyle(element).scrollbarWidth)).not.toBe("none");
                    } else {
                        if (layout.options.viewport.width >= 1360) {
                            expect(await documents.evaluate((element) => element.getBoundingClientRect().width)).toBe(200);

                            expect(await page.locator('[data-sidebar-scroll="outline"]').evaluate((element) => element.getBoundingClientRect().width)).toBe(
                                await documents.evaluate((element) => element.getBoundingClientRect().width),
                            );

                            // 본문은 1920px 페이지 안에서 양쪽 바깥 여백 28px, 사이드바 200px, 간격 32px을 뺀 나머지 전체
                            expect(await page.getByRole("main").evaluate((element) => element.getBoundingClientRect().width)).toBe(
                                await page.evaluate(() => Math.min(document.documentElement.getBoundingClientRect().width, 1920) - (28 + 200 + 32) * 2),
                            );
                        }

                        if (layout.options.forcedColors === "active") {
                            expect(await documents.evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe("thin");
                        }
                    }

                    expect(errors).toStrictEqual([]);
                });

                if (hasDrawer) {
                    await test.step("Escape로 닫으면 탐색 열기 버튼으로 포커스가 복귀한다", async () => {
                        /**
                         * GIVEN
                         * 모달로 연 탐색 대화상자
                         */

                        /**
                         * WHEN
                         * Escape 입력
                         */
                        await page.keyboard.press("Escape");

                        /**
                         * THEN
                         * 닫힌 대화상자와 탐색 열기 버튼의 포커스
                         */
                        await expect(page.getByRole("dialog", {name: "Navigation", exact: true})).toBeHidden();
                        await expect(page.getByRole("button", {name: "Open navigation", exact: true})).toBeFocused();
                        expect(errors).toStrictEqual([]);
                    });
                }
            });
        });
    }

    test.describe("위치와 포커스", () => {
        test("[NAV-010] 화면 크기와 문서가 바뀌어도 위치, 포커스, 앵커를 유지한다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 스크롤 가능한 문서 목록과 목차
             */
            const errors: string[] = [];
            const scriptRequests: string[] = [];

            page.on("pageerror", (error) => errors.push(error.message));

            page.on("request", (request) => {
                if (request.resourceType() === "script") {
                    scriptRequests.push(request.url());
                }
            });

            await page.goto("/guide/");
            await page.bringToFront();

            const documents = page.locator('[data-sidebar-scroll="documents"]');
            const outline = page.locator('[data-sidebar-scroll="outline"]');
            const cursor = page.locator("[data-cursor-face]");
            const navigation = page.locator("[data-sidebar-docs]");
            const details = page.locator("details");
            const hiddenHeading = page.locator("#hidden-detail .wg_article__headingText");

            // 소수 높이와 스크롤 앵커링의 반올림만 허용
            const roundingTolerance = 1;

            await test.step("새로고침하면 첫 프레임부터 저장한 두 위치를 복원한다", async () => {
                /**
                 * GIVEN
                 * 처음 연 와이드 배치의 문서
                 */

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

                // 외부 스크립트 수신 전 첫 프레임의 저장 위치 복원
                await page.addInitScript(() => {
                    window.navigationFrames = [];

                    let frames = 0;

                    /**
                     * 최초 프레임부터 적용한 탐색 위치 수집
                     */
                    const sample = () => {
                        const documents = document.querySelector<HTMLElement>('[data-sidebar-scroll="documents"]');
                        const outline = document.querySelector<HTMLElement>('[data-sidebar-scroll="outline"]');

                        if (documents && outline) {
                            window.navigationFrames.push({documents: documents.scrollTop, outline: outline.scrollTop});
                        }

                        if (++frames < 45) {
                            requestAnimationFrame(sample);
                        }
                    };

                    requestAnimationFrame(sample);
                });

                // 브라우저 도구 모음으로 포커스 이동 후 새로고침
                await page.evaluate(() => dispatchEvent(new Event("blur")));
                await expect(cursor).toHaveCSS("visibility", "hidden");
                await page.reload();
                await page.waitForFunction(() => window.navigationFrames.length >= 10);

                /**
                 * THEN
                 * 첫 프레임부터 원위치와 커서 표시 유지
                 */
                await expect(cursor).toHaveCSS("visibility", "visible");

                for (const frame of await page.evaluate(() => window.navigationFrames)) {
                    expect(Math.abs(frame.documents - 200)).toBeLessThanOrEqual(roundingTolerance);
                    expect(Math.abs(frame.outline - 250)).toBeLessThanOrEqual(roundingTolerance);
                }
            });

            await test.step("다른 문서로 이동하면 목차 위치만 초기화한다", async () => {
                /**
                 * GIVEN
                 * 두 탐색 영역의 위치를 복원한 문서
                 */

                /**
                 * WHEN
                 * 다른 문서로 이동
                 */
                await page.goto("/page-1/");

                /**
                 * THEN
                 * 문서 목록 위치 유지, 목차 위치 초기화
                 */
                expect(Math.abs((await documents.evaluate((element) => element.scrollTop)) - 200)).toBeLessThanOrEqual(roundingTolerance);
                await expect(outline).toHaveJSProperty("scrollTop", 0);
            });

            await test.step("해시로 문서를 열면 해시의 하위 제목을 선택한다", async () => {
                /**
                 * GIVEN
                 * 목차 위치를 초기화한 다른 문서
                 */

                /**
                 * WHEN
                 * 하위 제목 해시가 있는 주소로 이동
                 */
                await page.goto("/guide/#detail-10");

                /**
                 * THEN
                 * 해시의 하위 제목 하나만 현재 위치, 상위 절의 현재 위치 표시 없음
                 */
                await expect(page.locator('[aria-current="location"]')).toHaveAttribute("href", "#detail-10");
                await expect(page.locator('[aria-current="location"]')).toHaveCount(1);
                await expect(page.locator('a[href="#section-10"]')).not.toHaveAttribute("aria-current");
            });

            await test.step("배치를 전환해도 독립 스크롤, 포커스, 본문을 유지한다", async () => {
                /**
                 * GIVEN
                 * 접힌 제목으로 이동해 내용을 공개한 와이드 배치의 문서
                 */
                await page.getByRole("link", {name: "Hidden detail", exact: true}).click();
                await expect(details).toHaveJSProperty("open", true);
                await expect(hiddenHeading).toHaveClass(/wg_article__headingText--highlighted/);

                const body = await page.getByRole("main").elementHandle();

                /**
                 * WHEN
                 * 데스크톱과 드로어 배치에서 각각 스크롤하고 포커스한 뒤 데스크톱 배치로 복귀
                 */
                await page.setViewportSize({width: 1280, height: 600});
                await expect(navigation).toHaveAttribute("data-sidebar-layout", "desktop");

                await documents.evaluate((element) => {
                    element.scrollTop = 80;
                });

                await expect.poll(async () => (await readNavigationScroll(page))?.desktop?.documents).toBe(80);

                const focused = page.getByRole("link", {name: "Page 10", exact: true});

                await focused.focus();

                const desktopPosition = await documents.evaluate((element) => element.scrollTop);

                await page.setViewportSize({width: 390, height: 844});
                await expect(page.getByRole("button", {name: "Open navigation", exact: true})).toBeFocused();
                await page.getByRole("button", {name: "Open navigation", exact: true}).click();

                await documents.evaluate((element) => {
                    element.scrollTop = 180;
                });

                await expect.poll(async () => (await readNavigationScroll(page))?.drawer?.documents).toBe(180);
                await focused.focus();
                await page.setViewportSize({width: 1280, height: 600});
                await expect(navigation).toHaveAttribute("data-sidebar-layout", "desktop");

                /**
                 * THEN
                 * 데스크톱 배치의 포커스와 스크롤 위치 복원, 닫힌 드로어, 본문 요소 유지
                 */
                await expect(focused).toBeFocused();
                await expect(documents).toHaveJSProperty("scrollTop", desktopPosition);
                await expect(page.getByRole("dialog", {name: "Navigation", exact: true})).toBeHidden();
                expect(await body.evaluate((element) => element === document.querySelector<HTMLElement>("main"))).toBe(true);
            });

            await test.step("접힌 제목으로 이동하면 내용을 공개하고 강조를 정리한다", async () => {
                /**
                 * GIVEN
                 * 와이드 배치로 돌아와 다시 접은 내용
                 */
                await page.setViewportSize({width: 1920, height: 600});
                await expect(navigation).toHaveAttribute("data-sidebar-layout", "wide");
                await page.getByText("Folded context", {exact: true}).click();
                await expect(details).toHaveJSProperty("open", false);

                /**
                 * WHEN
                 * 목차 링크로 접힌 제목 이동
                 */
                await page.getByRole("link", {name: "Hidden detail", exact: true}).click();

                /**
                 * THEN
                 * 내용 공개와 강조 정리, 모든 단계의 외부 스크립트 요청과 페이지 오류 없음
                 */
                await expect(details).toHaveJSProperty("open", true);
                await expect(hiddenHeading).toHaveClass(/wg_article__headingText--highlighted/);
                await expect(hiddenHeading).not.toHaveClass(/wg_article__headingText--highlighted/);
                expect(scriptRequests, "one inline entry must provide every browser behavior").toStrictEqual([]);
                expect(errors).toStrictEqual([]);
            });
        });
    });

    test.describe("움직임 줄이기", () => {
        test.use({reducedMotion: "reduce"});

        test("[NAV-011] 움직임 줄이기 설정에서는 커서 장식을 숨긴다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 움직임 줄이기를 켠 브라우저
             */

            /**
             * WHEN
             * 문서 조회와 커서 이동
             */
            await page.goto("/guide/");
            await page.mouse.move(500, 200);

            // 커서 표시가 반영되는 화면 갱신 대기
            await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

            /**
             * THEN
             * 커서 장식 미표시
             */
            await expect(page.locator("[data-cursor-face]")).toHaveCSS("visibility", "hidden");
        });
    });

    test.describe("커서 장식", () => {
        test("[NAV-020] 새로고침 직전 커서 표시 조건이 잠시 꺼져도 마지막 좌표를 이어받는다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 마우스 좌표에 표시한 커서 장식
             */
            const cursor = page.locator("[data-cursor-face]");

            await page.goto("/guide/");
            await page.mouse.move(500, 200);
            await expect(cursor).toHaveCSS("visibility", "visible");

            /**
             * WHEN
             * Windows Chromium처럼 문서를 떠나기 직전 표시 조건이 잠시 꺼졌다 켜진 뒤 새로고침
             */
            await page.emulateMedia({reducedMotion: "reduce"});
            await expect(cursor).toHaveCSS("visibility", "hidden");
            await page.emulateMedia({reducedMotion: "no-preference"});
            await page.reload();

            /**
             * THEN
             * 새 마우스 이동 없이 마지막 좌표에 다시 표시
             */
            await expect(cursor).toHaveCSS("visibility", "visible");
        });
    });

    test.describe("저장소", () => {
        test("[NAV-015] 구형 저장 키의 좌표는 복원하지 않는다", {tag: ["@high", "@negative"]}, async ({page}) => {
            /**
             * GIVEN
             * 현재 문서 목록과 일치하는 구형 배치별 저장값
             */
            await page.goto("/guide/");

            const signature = await page.locator("[data-sidebar-docs]").evaluate((element) => {
                return [...element.querySelectorAll<HTMLAnchorElement>(".wg_docTree__root a[href]")].map((link) => `${link.pathname}:${link.textContent}`).join("\n");
            });

            await page.addInitScript(
                (options) => {
                    sessionStorage.removeItem(options.key);
                    sessionStorage.setItem(`${options.key}:desktop`, JSON.stringify({navigation: options.signature, pathname: "/guide/", documents: 180, outline: 120}));
                },
                {key: storage_scroll_key, signature},
            );

            /**
             * WHEN
             * 현재 persist 저장값이 없는 문서 새로고침
             */
            await page.reload();

            /**
             * THEN
             * 구형 좌표 대신 초기 위치를 현재 스토어에 저장
             */
            await expect(page.locator('[data-sidebar-scroll="documents"]')).toHaveJSProperty("scrollTop", 0);
            await expect(page.locator('[data-sidebar-scroll="outline"]')).toHaveJSProperty("scrollTop", 0);
            await expect.poll(async () => (await readNavigationScroll(page))?.wide).toStrictEqual({documents: 0, outline: 0});
        });

        for (const scenario of [
            {caseId: "NAV-012", condition: "저장소가 차단돼도", mode: "blocked"},
            {caseId: "NAV-013", condition: "저장값이 손상돼도", mode: "corrupt"},
        ]) {
            test(`[${scenario.caseId}] ${scenario.condition} 문서를 이동한다`, {tag: ["@high", "@negative"]}, async ({page}) => {
                /**
                 * GIVEN
                 * 차단되거나 손상된 브라우저 저장소
                 */
                await page.addInitScript(
                    (options) => {
                        if (options.mode === "blocked") {
                            for (const key of ["localStorage", "sessionStorage"]) {
                                Object.defineProperty(window, key, {
                                    get: () => {
                                        throw new DOMException("Storage blocked", "SecurityError");
                                    },
                                });
                            }
                        } else {
                            sessionStorage.setItem(options.key, "{broken");
                        }
                    },
                    {mode: scenario.mode, key: storage_scroll_key},
                );

                const errors: string[] = [];

                page.on("pageerror", (error) => errors.push(error.message));

                /**
                 * WHEN
                 * 탐색 스크롤과 다른 문서로 이동
                 */
                await page.goto("/guide/");

                await page.locator('[data-sidebar-scroll="documents"]').evaluate((element) => {
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

    test.describe("목차와 앵커", () => {
        test("[NAV-016] 문서 끝 구간의 목차는 제목을 건너뛰지 않고 이동한 제목은 스크롤 전까지 유지한다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 목차 순서와 스크롤 끝 위치를 조회한 문서
             */
            await page.goto("/guide/");

            const current = page.locator('[aria-current="location"]');
            const order = await page.locator("[data-toc-link], [data-toc-sub-link]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
            const scrollEnd = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);

            await test.step("마지막 화면을 내려가면 남은 제목을 차례로 표시한다", async () => {
                /**
                 * GIVEN
                 * 맨 위에서 연 문서
                 */

                /**
                 * WHEN
                 * 마지막 화면을 작은 간격으로 스크롤
                 */
                const seen: (string | null)[] = [];

                for (let position = scrollEnd - 600; position <= scrollEnd; position += 20) {
                    await page.evaluate((top) => scrollTo({top, behavior: "instant"}), position);
                    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

                    const href = await current.getAttribute("href");

                    if (seen.at(-1) !== href) {
                        seen.push(href);
                    }
                }

                const indexes = seen.map((href) => order.indexOf(href));

                /**
                 * THEN
                 * 목차 순서의 연속 변경, 접힌 제목을 제외한 마지막 제목에서 종료
                 */
                expect(indexes).toStrictEqual(indexes.map((_index, step) => indexes[0] + step));
                expect(seen.at(-1)).toBe("#detail-23");
            });

            await test.step("끝 구간 제목으로 이동하면 목차는 다른 제목을 거치지 않고 도착한 제목을 표시한다", async () => {
                /**
                 * GIVEN
                 * 끝 구간 제목으로 이동한 뒤 목차 변경을 기록하는 문서
                 */
                await page.getByRole("link", {name: "Detail 22", exact: true}).click();
                await expect(current).toHaveAttribute("href", "#detail-22");

                await page.evaluate(() => {
                    window.tocChanges = [];

                    const toc = document.querySelector("[data-sidebar-toc]");

                    if (toc === null) {
                        return;
                    }

                    new MutationObserver(() => {
                        const href = document.querySelector('[aria-current="location"]')?.getAttribute("href");

                        if (href) {
                            window.tocChanges.push(href);
                        }
                    }).observe(toc, {subtree: true, attributeFilter: ["aria-current"]});
                });

                /**
                 * WHEN
                 * 읽는 선에 닿지 못하는 끝 절 제목의 실제 클릭
                 */
                await page.getByRole("link", {name: "Section 23", exact: true}).hover();
                await page.mouse.down();

                // 누르고 떼는 사이의 화면 갱신
                await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                await page.mouse.up();

                /**
                 * THEN
                 * 제목이 읽는 선에 도착, 누른 제목으로 한 번만 변경
                 */
                await expect
                    .poll(() => {
                        return page
                            .locator("#section-23")
                            .evaluate((element) => Math.abs(element.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(element).scrollMarginTop)));
                    })
                    .toBeLessThanOrEqual(1);

                await expect.poll(() => page.evaluate(() => window.tocChanges)).toStrictEqual(["#section-23"]);
            });

            await test.step("끝 절 제목에 도착한 뒤 짧게 스크롤해도 목차는 그 제목을 유지한다", async () => {
                /**
                 * GIVEN
                 * 끝 절 제목에 도착한 문서
                 */

                /**
                 * WHEN
                 * 본문 위 짧은 휠 스크롤
                 */
                await page.mouse.move(800, 300);
                await page.mouse.wheel(0, 10);

                /**
                 * THEN
                 * 도착한 제목 유지
                 */
                await expect(current).toHaveAttribute("href", "#section-23");
            });
        });

        test("[NAV-017] 해시로 연 문서를 새로고침하면 앵커로 갔다가 다시 이동하지 않는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 해시 제목으로 연 뒤 휠로 다른 위치에 이동한 문서
             */
            await page.goto("/guide/#detail-10");

            await expect
                .poll(() => {
                    return page
                        .locator("#detail-10")
                        .evaluate((element) => Math.abs(element.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(element).scrollMarginTop)));
                })
                .toBeLessThanOrEqual(1);

            await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");

            const anchorPosition = await page.evaluate(() => scrollY);

            await page.mouse.move(800, 300);
            await page.mouse.wheel(0, -1000);
            await expect.poll(() => page.evaluate(() => scrollY)).toBe(anchorPosition - 1000);

            // 외부 스크립트 수신 전 첫 프레임부터 본문 위치 수집
            await page.addInitScript(() => {
                window.readingFrames = [];

                /**
                 * 최초 프레임부터 적용한 본문 위치 수집
                 */
                const sample = () => {
                    window.readingFrames.push(scrollY);

                    if (window.readingFrames.length < 45) {
                        requestAnimationFrame(sample);
                    }
                };

                requestAnimationFrame(sample);
            });

            await test.step("같은 주소를 새로고침하면 한 위치를 유지하고 앵커를 강조하지 않는다", async () => {
                /**
                 * GIVEN
                 * 다음 새로고침부터 프레임별 위치를 기록할 문서
                 */

                /**
                 * WHEN
                 * 같은 주소 새로고침
                 */
                await page.reload();
                await page.waitForFunction(() => window.readingFrames.length >= 45);

                const frames = await page.evaluate(() => window.readingFrames);

                /**
                 * THEN
                 * 문서 표시 후 위치 변경 없음, 앵커 도착 강조 없음, 첫 입력 전 즉시 스크롤
                 *
                 *   - 제약: 이전 위치와 앵커 중 복원 대상은 Chromium의 탐색 상태 저장 시점이 결정
                 */
                expect(new Set(frames.filter((position) => position !== 0)).size).toBe(1);

                // 강조 유지 시간 종료 전의 즉시 조회
                expect(await page.locator(".wg_article__headingText--highlighted").count()).toBe(0);
                await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
            });

            await test.step("새로고침 뒤 휠을 굴리면 부드러운 스크롤로 돌아간다", async () => {
                /**
                 * GIVEN
                 * 즉시 스크롤 상태로 새로고침한 문서
                 */

                /**
                 * WHEN
                 * 본문 휠 입력
                 */
                await page.mouse.wheel(0, 100);

                /**
                 * THEN
                 * 부드러운 스크롤 복귀
                 */
                await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");
            });
        });

        test("[NAV-028] 높은 화면에서 문서를 처음 열면 목차는 첫 절을 표시한다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 첫 화면에 여러 제목이 들어오는 높은 와이드 화면
             */
            await page.setViewportSize({width: 1920, height: 1400});

            /**
             * WHEN
             * 문서의 처음 위치 열기
             */
            await page.goto("/guide/");

            /**
             * THEN
             * 첫 절 제목의 현재 위치 표시
             */
            await expect(page.getByRole("navigation", {name: "On this page", exact: true}).locator('[aria-current="location"]')).toHaveText("Section 0");
        });
    });

    test.describe("스크롤 입력", () => {
        test("[NAV-018] 화면에 들어가는 탐색 영역의 휠은 본문을 스크롤하고 넘치는 목록은 끝에서 휠 전파를 막는다", {tag: "@high"}, async ({page}) => {
            /**
             * GIVEN
             * 1600px 높이 화면에서 연 문서
             */
            await page.setViewportSize({width: 1920, height: 1600});
            await page.goto("/guide/");

            for (const area of [
                {kind: "documents", name: "문서 목록"},
                {kind: "outline", name: "목차"},
            ]) {
                await test.step(`${area.name} 위의 링크와 빈 영역에서 휠을 굴리면 본문이 스크롤된다`, async () => {
                    /**
                     * GIVEN
                     * 화면 높이 안에 모두 들어가는 탐색 영역
                     */
                    const list = page.locator(`[data-sidebar-scroll="${area.kind}"]`);

                    await expect(list).not.toHaveClass(/wg_sidebar__scroll--overflow/);

                    const center = await list.evaluate((element) => element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2);

                    for (const point of [
                        {name: "링크", y: 200},
                        {name: "빈 영역", y: 1550},
                    ]) {
                        await page.evaluate(() => scrollTo({top: 0, behavior: "instant"}));

                        /**
                         * WHEN
                         * 탐색 영역 위에서 휠 이동
                         */
                        await page.mouse.move(center, point.y);
                        await page.mouse.wheel(0, 300);

                        /**
                         * THEN
                         * 본문 스크롤
                         */
                        await expect.poll(() => page.evaluate(() => scrollY), {message: point.name}).toBeGreaterThan(0);
                    }
                });
            }

            await test.step("넘치는 문서 목록의 끝에서 휠을 굴리면 본문이 움직이지 않는다", async () => {
                /**
                 * GIVEN
                 * 화면보다 긴 문서 목록을 끝까지 내린 상태
                 */
                await page.setViewportSize({width: 1920, height: 600});
                await page.evaluate(() => scrollTo({top: 0, behavior: "instant"}));

                const documents = page.locator('[data-sidebar-scroll="documents"]');

                await expect(documents).toHaveClass(/wg_sidebar__scroll--overflow/);

                await documents.evaluate((element) => {
                    element.scrollTop = element.scrollHeight;
                });

                /**
                 * WHEN
                 * 목록 위에서 휠 이동
                 */
                await page.mouse.move(100, 300);
                await page.mouse.wheel(0, 300);

                // 휠 스크롤이 반영되는 화면 갱신 대기
                await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

                /**
                 * THEN
                 * 본문 위치 유지
                 */
                await expect(documents).toHaveJSProperty("scrollTop", await documents.evaluate((element) => element.scrollHeight - element.clientHeight));
                expect(await page.evaluate(() => scrollY)).toBe(0);
            });
        });
    });

    test.describe("스크립트 없음", () => {
        test.use({javaScriptEnabled: false});

        test("[NAV-019] 스크립트 연결 전 문서 스크롤은 즉시 이동한다", {tag: "@mid"}, async ({page}) => {
            /**
             * GIVEN
             * 스크립트를 끈 브라우저
             */

            /**
             * WHEN
             * 문서 조회
             */
            await page.goto("/guide/");

            /**
             * THEN
             * 부드러운 스크롤 미적용, 새로고침 위치 복원도 즉시 이동
             */
            await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
        });
    });
});

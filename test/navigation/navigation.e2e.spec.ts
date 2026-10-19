import {expect} from "@playwright/test";
import {test} from "@test/_fixture/navigation";
import {readNavigationScroll} from "@test/_fixture/read-navigation-scroll";
import {navigation_scroll_storage_key} from "@/store/navigation/navigation-storage";

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
        await page.bringToFront();
        const documents = page.locator('[data-sidebar-scroll="documents"]');
        const outline = page.locator('[data-sidebar-scroll="outline"]');
        const cursor = page.locator("[data-cursor-face]");
        const navigation = page.locator("[data-sidebar-docs]");
        const details = page.locator("details");
        const hiddenHeading = page.locator("#hidden-detail .wg_article__headingText");

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
                    if (documents && outline) window.navigationFrames.push({documents: documents.scrollTop, outline: outline.scrollTop});
                    if (++frames < 45) requestAnimationFrame(sample);
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
            await expect(hiddenHeading).toHaveClass(/wg_article__headingText--highlighted/);
            const body = await page.locator("main").elementHandle();
            await page.setViewportSize({width: 1280, height: 600});
            await expect(navigation).toHaveAttribute("data-sidebar-layout", "desktop");
            await documents.evaluate((element) => {
                element.scrollTop = 80;
            });
            await expect.poll(async () => (await readNavigationScroll(page))?.desktop?.documents).toBe(80);
            const focused = page.getByRole("link", {name: "Page 10", exact: true});
            await focused.focus();
            const desktopPosition = await page.locator('[data-sidebar-scroll="documents"]').evaluate((element) => element.scrollTop);
            await page.setViewportSize({width: 390, height: 844});
            await expect(page.getByRole("button", {name: "Open navigation", exact: true})).toBeFocused();
            await page.getByRole("button", {name: "Open navigation", exact: true}).click();
            await documents.evaluate((element) => {
                element.scrollTop = 180;
            });
            await expect.poll(async () => (await readNavigationScroll(page))?.drawer?.documents).toBe(180);
            await page.getByRole("link", {name: "Page 10", exact: true}).focus();
            await page.setViewportSize({width: 1280, height: 600});
            await expect(navigation).toHaveAttribute("data-sidebar-layout", "desktop");
            await expect(focused).toBeFocused();
            await expect(documents).toHaveJSProperty("scrollTop", desktopPosition);
            await expect(page.locator("dialog")).toHaveJSProperty("open", false);
            expect(await body.evaluate((element) => element === document.querySelector<HTMLElement>("main"))).toBe(true);
        });
        await test.step("접힌 제목으로 이동하면 내용을 공개하고 강조를 정리한다", async () => {
            await page.setViewportSize({width: 1920, height: 600});
            await expect(navigation).toHaveAttribute("data-sidebar-layout", "wide");
            await page.locator("details summary").click();
            await expect(details).toHaveJSProperty("open", false);
            await page.getByRole("link", {name: "Hidden detail", exact: true}).click();
            await expect(details).toHaveJSProperty("open", true);
            await expect(hiddenHeading).toHaveClass(/wg_article__headingText--highlighted/);
            await expect(hiddenHeading).not.toHaveClass(/wg_article__headingText--highlighted/);
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
            {key: navigation_scroll_storage_key, signature},
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
    test("[NAV-016] 문서 끝 구간의 목차는 제목을 건너뛰지 않고 이동한 제목은 스크롤 전까지 유지한다", {tag: "@high"}, async ({page}) => {
        await page.goto("/guide/");
        const current = page.locator('[aria-current="location"]');
        const order = await page.locator("[data-toc-link], [data-toc-sub-link]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
        const scrollEnd = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
        await test.step("마지막 화면을 내려가면 남은 제목을 차례로 표시한다", async () => {
            /**
             * WHEN
             * 마지막 화면을 작은 간격으로 스크롤
             */
            const seen: (string | null)[] = [];
            for (let position = scrollEnd - 600; position <= scrollEnd; position += 20) {
                await page.evaluate((top) => scrollTo({top, behavior: "instant"}), position);
                await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                const href = await current.getAttribute("href");
                if (seen.at(-1) !== href) seen.push(href);
            }

            /**
             * THEN
             * 목차 순서대로 이어지고 접힌 제목을 제외한 마지막 제목에서 끝남
             */
            const indexes = seen.map((href) => order.indexOf(href));
            expect(indexes).toStrictEqual(indexes.map((_index, step) => indexes[0] + step));
            expect(seen.at(-1)).toBe("#detail-23");
        });
        await test.step("목차로 이동한 끝 절 제목은 사용자 스크롤 전까지 유지한다", async () => {
            /**
             * WHEN
             * 문서 끝에서 읽는 선에 닿지 못하는 제목 선택
             */
            await page.getByRole("link", {name: "Section 23", exact: true}).click();

            /**
             * THEN
             * 선택한 제목 유지, 휠 입력 후 위치 기준 제목
             */
            await expect(current).toHaveAttribute("href", "#section-23");
            expect(await page.evaluate(() => Math.round(scrollY))).toBe(Math.round(scrollEnd));
            await page.mouse.move(800, 300);
            await page.mouse.wheel(0, 100);
            await expect(current).toHaveAttribute("href", "#detail-23");
        });
    });
    test("[NAV-017] hash로 연 문서를 새로고침하면 앵커로 갔다가 다시 이동하지 않는다", {tag: "@high"}, async ({page}) => {
        /**
         * GIVEN
         * hash 제목으로 연 뒤 휠로 다른 위치에 이동한 문서
         */
        await page.goto("/guide/#detail-10");
        const heading = page.locator("#detail-10");
        await expect
            .poll(() => heading.evaluate((element) => Math.abs(element.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(element).scrollMarginTop))))
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
                if (window.readingFrames.length < 45) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
        });

        /**
         * WHEN
         * 같은 주소 새로고침
         */
        await page.reload();
        await page.waitForFunction(() => window.readingFrames.length >= 45);

        /**
         * THEN
         * 문서 표시 후 위치 변경 없음, 앵커 도착 강조 없음, 첫 입력 전 즉시 스크롤
         *
         *   - 제약: 이전 위치와 앵커 중 복원 대상은 Chromium의 탐색 상태 저장 시점이 결정
         */
        const frames = await page.evaluate(() => window.readingFrames);
        expect(new Set(frames.filter((position) => position !== 0)).size).toBe(1);

        // 강조 유지 시간 종료 전의 즉시 조회
        expect(await page.locator(".wg_article__headingText--highlighted").count()).toBe(0);
        await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
        await page.mouse.wheel(0, 100);
        await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");
    });
    test("[NAV-018] 화면에 들어가는 탐색 영역의 휠은 본문을 스크롤하고 넘치는 목록은 끝에서 휠을 가둔다", {tag: "@high"}, async ({page}) => {
        await page.setViewportSize({width: 1920, height: 1600});
        await page.goto("/guide/");
        for (const area of [
            {kind: "documents", name: "문서 목록"},
            {kind: "outline", name: "목차"},
        ]) {
            await test.step(`${area.name} 위의 링크와 빈 영역`, async () => {
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
        await test.step("넘치는 문서 목록의 끝", async () => {
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

            /**
             * THEN
             * 본문 위치 유지
             */
            await expect(documents).toHaveJSProperty("scrollTop", await documents.evaluate((element) => element.scrollHeight - element.clientHeight));
            expect(await page.evaluate(() => scrollY)).toBe(0);
        });
    });
    test.describe("스크립트 없음", () => {
        test.use({javaScriptEnabled: false});
        test("[NAV-019] 스크립트 연결 전 문서 스크롤은 즉시 이동한다", {tag: "@mid"}, async ({page}) => {
            /**
             * WHEN
             * 스크립트 없이 문서 열기
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

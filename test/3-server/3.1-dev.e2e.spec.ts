import {once} from "node:events";
import {readFile, rm, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/dev";

/**
 * 개발 서버(src/entry/dev) 검증
 *
 *   - 설치 번들 실행과 저장소 소스 실행
 */
test.describe("개발 서버", () => {
    test.describe("설치 번들", () => {
        test("[DEV-001] 문서 추가, 변경, 삭제를 브라우저에 반영하고 잘못된 문서에서 복구한다", {tag: "@high"}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 실제 개발 서버와 갱신 통신이 연결된 홈
             */
            await Promise.all([page.waitForEvent("console", (message) => message.text().includes("[vite] connected")), page.goto("/")]);
            await expect(page.getByText("Initial content.", {exact: true})).toBeVisible();

            await test.step("문서를 추가하고 홈을 고치면 새로고침 없이 반영한다", async () => {
                /**
                 * GIVEN
                 * 처음 내용을 표시한 홈
                 */

                /**
                 * WHEN
                 * 문서 파일 추가와 홈 변경
                 */
                await writeFile(join(devSite.root, "public/guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Added section\n");
                await expect(page.getByRole("link", {name: "Guide", exact: true})).toBeVisible();
                await writeFile(join(devSite.root, "README.md"), "# Development home\n\nUpdated content.\n");

                /**
                 * THEN
                 * 수동 새로고침 없는 새 내용
                 */
                await expect(page.getByText("Updated content.", {exact: true})).toBeVisible();
            });

            await test.step("문법 오류가 있는 동안 마지막 정상 문서를 유지한다", async () => {
                /**
                 * GIVEN
                 * 추가한 문서를 정상 처리한 개발 서버
                 */

                /**
                 * WHEN
                 * 잘못된 머리말 저장 후 문서 요청
                 */
                await writeFile(join(devSite.root, "public/guide.md"), "---\nname: [\n---\n");
                await expect.poll(() => devSite.errors.length).toBeGreaterThan(0);

                const response = await page.request.get("/guide/");

                /**
                 * THEN
                 * 마지막 정상 응답 유지
                 */
                expect(response.status()).toBe(200);
                expect(await response.text()).toContain("Added section");
            });

            await test.step("같은 파일의 오류를 수정하면 새 내용으로 복구한다", async () => {
                /**
                 * GIVEN
                 * 머리말 오류로 마지막 정상 문서를 유지한 개발 서버
                 */

                /**
                 * WHEN
                 * 잘못된 머리말을 정상 문서로 교체한 뒤 자동 갱신된 탐색 링크 클릭
                 */
                await writeFile(join(devSite.root, "public/guide.md"), "---\nname: Recovered guide\nlabel: Recovered guide\ngroup: Guide\n---\n\n## Recovered section\n");
                await page.getByRole("link", {name: "Recovered guide", exact: true}).click();

                /**
                 * THEN
                 * 복구한 문서의 새 본문
                 */
                await expect(page.getByRole("heading", {name: "Recovered section", exact: true})).toBeVisible();
            });

            await test.step("파일을 삭제하면 탐색과 문서 응답에서 제외한다", async () => {
                /**
                 * GIVEN
                 * 갱신 통신을 다시 연결한 홈
                 */
                await Promise.all([page.waitForEvent("console", (message) => message.text().includes("[vite] connected")), page.goto("/")]);

                /**
                 * WHEN
                 * 문서 파일 삭제
                 */
                await rm(join(devSite.root, "public/guide.md"));

                /**
                 * THEN
                 * 링크 제거와 삭제한 문서의 404 응답
                 */
                await expect(page.getByRole("link", {name: "Recovered guide", exact: true})).toHaveCount(0);
                expect((await page.request.get("/guide/")).status()).toBe(404);
            });
        });

        test("[DEV-002] Vite 통신만 공개하고 문서 원본, 설정, 임의 파일은 제공하지 않는다", {tag: ["@high", "@negative"]}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 문서 루트의 서버 설정과 원본 파일
             */
            await writeFile(join(devSite.root, "for-humanity.config.ts"), 'export default {description: "private-config-value"};');

            /**
             * WHEN
             * Vite 클라이언트와 직접 파일 경로 요청
             */
            const client = await page.request.get("/@vite/client");
            const sourcePath = `/@fs/${join(devSite.root, "README.md").replaceAll("\\", "/").replace(/^\//, "")}`;
            const paths = ["/README.md", "/for-humanity.config.ts", sourcePath, "/_fh/reload", "/src/entry/cli/cli.ts"];
            const responses = await Promise.all(paths.map((path) => page.request.get(path)));

            /**
             * THEN
             * 갱신 클라이언트만 성공, 원본과 이전 SSE 경로는 404
             */
            expect(client.status()).toBe(200);
            expect(responses.map((response) => response.status())).toStrictEqual(paths.map(() => 404));
        });

        test("[DEV-004] 누락된 스니펫과 그림을 추가하면 복구하고 수정과 삭제를 반영한다", {tag: ["@high", "@negative"]}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 연결된 개발 페이지와 아직 없는 로컬 참조
             */
            await Promise.all([page.waitForEvent("console", (message) => message.text().includes("[vite] connected")), page.goto("/")]);

            const home = join(devSite.root, "README.md");
            const snippet = join(devSite.root, "example.ts");
            const picture = join(devSite.root, "picture.svg");

            await writeFile(home, "# Assets\n\n<<< ./example.ts\n\n![Illustration](./picture.svg)\n\n```mermaid\ngraph LR\nA[Start] --> B[End]\n```\n");
            await expect.poll(() => devSite.errors.length).toBeGreaterThan(0);
            await expect(page.getByText("Initial content.", {exact: true})).toBeVisible();

            await test.step("빠진 파일만 추가해도 참조와 다이어그램을 복구한다", async () => {
                /**
                 * GIVEN
                 * 참조 파일이 없어 처음 내용을 유지한 홈
                 */

                /**
                 * WHEN
                 * 실패했던 참조의 파일 추가
                 */
                await writeFile(snippet, 'const message = "snippet-one";');
                await writeFile(picture, '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="blue"/></svg>');

                /**
                 * THEN
                 * 새 스니펫과 등록 이미지, 자체 호스팅 Mermaid 출력
                 */
                await expect(page.locator("pre.shiki")).toContainText("snippet-one");
                await expect(page.getByRole("img", {name: "Illustration"})).toBeVisible();
                await expect(page.locator('[data-mermaid-status="rendered"]')).toHaveCount(1);
            });

            await test.step("스니펫과 이미지 수정 시 새 내용과 지문을 사용한다", async () => {
                /**
                 * GIVEN
                 * 복구한 스니펫과 내용 지문 주소의 이미지
                 */
                const previousImage = await page.getByRole("img", {name: "Illustration"}).getAttribute("src");

                if (previousImage === null) {
                    throw new Error("등록 이미지 URL이 없습니다");
                }

                /**
                 * WHEN
                 * 참조 파일만 수정
                 */
                await writeFile(snippet, 'const message = "snippet-two";');
                await writeFile(picture, '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="red"/></svg>');

                /**
                 * THEN
                 * 스니펫과 이미지 URL 교체, 이전 URL 제거
                 */
                await expect(page.locator("pre.shiki")).toContainText("snippet-two");
                await expect(page.getByRole("img", {name: "Illustration"})).not.toHaveAttribute("src", previousImage);
                expect((await page.request.get(previousImage)).status()).toBe(404);
            });

            await test.step("참조 파일을 삭제하면 마지막 정상 문서를 유지하고 README 삭제는 반영한다", async () => {
                /**
                 * GIVEN
                 * 수정한 스니펫과 새 지문의 이미지를 표시한 홈
                 */

                /**
                 * WHEN
                 * 참조 파일 삭제 후 README 제거
                 */
                const previousErrors = devSite.errors.length;

                await rm(snippet);
                await rm(picture);
                await expect.poll(() => devSite.errors.length).toBeGreaterThan(previousErrors);
                await expect(page.locator("pre.shiki")).toContainText("snippet-two");
                await rm(home);

                /**
                 * THEN
                 * 이전 본문과 로컬 자원을 더 이상 출력하지 않는 홈
                 */
                await expect(page.locator("pre.shiki")).toHaveCount(0);
                await expect(page.getByRole("img", {name: "Illustration"})).toHaveCount(0);
                expect((await page.request.get("/")).status()).toBe(200);
            });
        });

        test("[DEV-005] 서버 종료는 갱신 연결, 파일 감시, HTTP 포트를 해제한다", {tag: "@high"}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 실제 WebSocket이 연결된 개발 서버
             */
            const [socket] = await Promise.all([page.waitForEvent("websocket"), page.goto("/")]);
            const closed = socket.waitForEvent("close");

            /**
             * WHEN
             * 변경 예약 직후 개발 서버 종료
             */
            const changed = once(devSite.server.watcher, "change");

            await writeFile(join(devSite.root, "README.md"), "# Closing server\n");
            await changed;
            await devSite.server.close();
            await closed;

            /**
             * THEN
             * 종료된 HTTP 포트와 비워진 파일 감시
             */
            expect(devSite.server.httpServer?.listening).toBe(false);
            expect(devSite.server.watcher.getWatched()).toStrictEqual({});
        });

        test("[DEV-006] 첫 문서 준비가 실패해도 파일을 수정하면 같은 서버에서 복구한다", {tag: ["@high", "@negative"]}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 첫 요청 전부터 잘못된 머리말이 있는 문서
             */
            const document = join(devSite.root, "public/guide.md");

            await writeFile(document, "---\nname: [\n---\n");

            await test.step("정상 스냅샷이 없으면 오류 응답을 제공한다", async () => {
                /**
                 * GIVEN
                 * 아직 문서를 요청하지 않은 개발 서버
                 */

                /**
                 * WHEN
                 * 최초 문서 요청
                 */
                const response = await page.request.get("/guide/");

                /**
                 * THEN
                 * 빈 페이지 성공 대신 준비 오류와 유지된 서버
                 */
                expect(response.status()).toBe(500);
                expect(devSite.errors.length).toBeGreaterThan(0);
                expect(devSite.server.httpServer?.listening).toBe(true);
            });

            await test.step("문서를 수정하면 재시작 없이 정상 응답을 복구한다", async () => {
                /**
                 * GIVEN
                 * 준비 오류를 반환하고 계속 실행 중인 개발 서버
                 */

                /**
                 * WHEN
                 * 실패 원인인 문서 수정
                 */
                await writeFile(document, "---\nname: Recovered guide\nlabel: Recovered guide\ngroup: Guide\n---\n\n## Ready after correction\n");

                /**
                 * THEN
                 * 같은 서버의 정상 응답
                 */
                await expect.poll(async () => (await page.request.get("/guide/")).status()).toBe(200);
            });

            await test.step("복구한 문서를 브라우저로 열면 본문과 탐색을 표시한다", async () => {
                /**
                 * GIVEN
                 * 정상 응답으로 복구한 개발 서버
                 */

                /**
                 * WHEN
                 * 복구한 문서 조회
                 */
                await page.goto("/guide/");

                /**
                 * THEN
                 * 실제 브라우저의 본문과 탐색 렌더
                 */
                await expect(page.getByRole("heading", {name: "Ready after correction", exact: true})).toBeVisible();
                await expect(page.getByRole("link", {name: "Recovered guide", exact: true})).toBeVisible();
            });
        });
    });

    test.describe("저장소 소스 스크립트 없음", () => {
        test.use({source: true, javaScriptEnabled: false});

        test("[DEV-008] 첫 요청과 새로고침은 JavaScript 없이 최신 CSS를 적용한다", {tag: "@high"}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 스크립트를 끈 브라우저와 소스 개발 서버의 셸 CSS
             */
            const path = join(devSite.kitRoot, "src/component/widget/shell/wg-shell.css");

            await test.step("첫 요청은 JavaScript 없이 전역 CSS와 셸 배치를 적용한다", async () => {
                /**
                 * GIVEN
                 * 아직 열지 않은 개발 페이지
                 */

                /**
                 * WHEN
                 * 최초 페이지 요청
                 */
                await page.goto("/");

                /**
                 * THEN
                 * JavaScript의 스타일 삽입 전에도 전역 CSS와 셸 배치 적용
                 */
                await expect(page.getByRole("main")).toHaveCSS("box-sizing", "border-box");
                await expect(page.locator("body")).toHaveCSS("display", "grid");
                await expect(page.locator("body")).toHaveCSS("margin-top", "0px");
            });

            await test.step("소스 CSS 수정 뒤 새로고침도 최신 스타일을 사용한다", async () => {
                /**
                 * GIVEN
                 * 최초 CSS를 적용한 페이지
                 */

                /**
                 * WHEN
                 * 패키지 재빌드 없이 CSS 수정 후 페이지 새로고침
                 */
                const changed = once(devSite.server.watcher, "change");

                await writeFile(path, (await readFile(path, "utf8")).replace("margin: 0 auto;", "margin: 7px auto;"));
                await changed;
                await page.reload();

                /**
                 * THEN
                 * 이전 빌드 CSS 대신 수정한 소스 스타일 적용
                 */
                await expect(page.locator("body")).toHaveCSS("margin-top", "7px");
                expect(devSite.errors).toStrictEqual([]);
            });
        });
    });

    test.describe("저장소 소스", () => {
        test.use({source: true});

        test("[DEV-009] CSS 파일 추가와 삭제는 HTML의 스타일 목록에 반영된다", {tag: "@high"}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 소스 스타일 목록을 사용하는 개발 페이지
             */
            const path = join(devSite.kitRoot, "src/component/widget/shell/_wg-shell-test.css");

            await page.goto("/");
            await expect(page.getByRole("main")).toHaveCSS("outline-style", "none");

            await test.step("새 CSS 파일은 등록 설정 없이 적용한다", async () => {
                /**
                 * GIVEN
                 * 테두리 스타일이 없는 본문
                 */

                /**
                 * WHEN
                 * 기존 소유자 폴더에 스타일 파일 추가
                 */
                await writeFile(path, ".wg_shell__main { outline: 2px solid rgb(4, 5, 6); }\n");

                /**
                 * THEN
                 * 새 HTML의 스타일 목록과 실제 렌더에 파일 반영
                 */
                await expect(page.getByRole("main")).toHaveCSS("outline-color", "rgb(4, 5, 6)");
                await expect(page.getByRole("main")).toHaveCSS("outline-style", "solid");
            });

            await test.step("삭제한 CSS 파일은 스타일 목록에서 제외한다", async () => {
                /**
                 * GIVEN
                 * 추가한 스타일 파일의 테두리를 적용한 본문
                 */

                /**
                 * WHEN
                 * 추가한 스타일 파일 삭제
                 */
                await rm(path);

                /**
                 * THEN
                 * 삭제 전 스타일이 남지 않고 정상 스냅샷 유지
                 */
                await expect(page.getByRole("main")).toHaveCSS("outline-style", "none");
                expect(devSite.errors).toStrictEqual([]);
            });
        });

        test("[DEV-007] 소스 개발에서도 Vite 파일 경로로 문서 원본과 설정을 읽을 수 없다", {tag: ["@high", "@negative"]}, async ({page, devSite}) => {
            /**
             * GIVEN
             * Vite 소스 변환을 사용하는 서버의 비공개 문서 입력
             */
            await writeFile(join(devSite.root, "for-humanity.config.ts"), 'export default {description: "private-config-value"};');
            await writeFile(join(devSite.root, "snippet.ts"), 'export const token = "private-snippet-value";');

            const paths = ["README.md", "for-humanity.config.ts", "snippet.ts"].map((name) => `/@fs/${join(devSite.root, name).replaceAll("\\", "/").replace(/^\//, "")}`);

            /**
             * WHEN
             * 정상 브라우저 진입점과 문서 원본의 Vite 파일 경로 요청
             */
            const entry = await page.request.get("/src/entry/browser/browser.tsx");
            const source = await page.request.get(`/@fs/${join(devSite.kitRoot, "src/entry/browser/browser.tsx").replaceAll("\\", "/").replace(/^\//, "")}`);
            const responses = await Promise.all(paths.map((path) => page.request.get(path)));
            const bodies = await Promise.all(responses.map((response) => response.text()));

            /**
             * THEN
             * 브라우저 코드는 제공하고 문서와 설정 파일은 접근 거부
             */
            expect(entry.status()).toBe(200);
            expect(source.status()).toBe(200);

            for (const response of responses) {
                expect([403, 404]).toContain(response.status());
            }

            for (const body of bodies) {
                expect(body).not.toContain("Initial content.");
                expect(body).not.toContain("private-config-value");
                expect(body).not.toContain("private-snippet-value");
            }
        });

        test("[DEV-003] CSS 변경은 페이지 상태를 유지하고 TSX 변경은 서버와 브라우저에 반영한다", {tag: "@high"}, async ({page, devSite}) => {
            /**
             * GIVEN
             * 최초 HTML의 스타일시트에 테두리가 있는 개발 페이지
             */
            const path = join(devSite.kitRoot, "src/component/widget/shell/wg-shell.css");
            const original = await readFile(path, "utf8");

            await writeFile(path, `${original}\n.wg_shell__main { outline: 3px solid rgb(1, 2, 3); }\n`);

            const errors: string[] = [];

            page.on("pageerror", (error) => errors.push(error.message));
            await page.setViewportSize({width: 760, height: 900});
            await page.goto("/");
            await expect(page.getByText("Initial content.", {exact: true})).toBeVisible();
            await expect(page.getByRole("main")).toHaveCSS("outline-style", "solid");
            await page.getByRole("button", {name: "Open navigation", exact: true}).click();
            await expect(page.getByRole("dialog", {name: "Navigation", exact: true})).toBeVisible();
            await page.getByRole("button", {name: "Close navigation", exact: true}).click();
            await page.evaluate(() => document.documentElement.setAttribute("data-dev-marker", "retained"));

            await test.step("CSS 갱신은 전체 문서를 다시 열지 않는다", async () => {
                /**
                 * GIVEN
                 * 테두리를 적용하고 문서 표식을 남긴 페이지
                 */

                /**
                 * WHEN
                 * 최초 스타일시트의 테두리 선언 삭제
                 */
                await writeFile(path, original);

                /**
                 * THEN
                 * 최초 스타일시트의 이전 선언 제거와 같은 페이지 상태 유지
                 */
                await expect(page.getByRole("main")).toHaveCSS("outline-style", "none");
                await expect(page.locator("html")).toHaveAttribute("data-dev-marker", "retained");
            });

            await test.step("서버 JSX 변경은 새 HTML로 반영한다", async () => {
                /**
                 * GIVEN
                 * CSS만 갱신해 문서 표식을 유지한 페이지
                 */

                /**
                 * WHEN
                 * 서버 셸의 언어 속성 변경
                 */
                const path = join(devSite.kitRoot, "src/component/widget/shell/wg-shell.tsx");

                await writeFile(path, (await readFile(path, "utf8")).replace('<html lang="ko"', '<html lang="en"'));

                /**
                 * THEN
                 * 서버 HTML 갱신과 브라우저 오류 미발생
                 */
                await expect(page.locator("html")).toHaveAttribute("lang", "en");
                expect(await page.locator("html").getAttribute("data-dev-marker")).toBeNull();
                expect(errors).toStrictEqual([]);
            });

            await test.step("브라우저 JSX 변경도 상호작용에 반영한다", async () => {
                /**
                 * GIVEN
                 * 서버 HTML을 새로 받은 페이지
                 */

                /**
                 * WHEN
                 * 클라이언트가 마운트하는 탐색 버튼 이름 변경 후 새 이름의 버튼 클릭
                 */
                const path = join(devSite.kitRoot, "src/component/widget/sidebar/wg-sidebar.tsx");

                await writeFile(path, (await readFile(path, "utf8")).replace("aria-label={copy_nav_open}", 'aria-label="Updated navigation"'));
                await page.getByRole("button", {name: "Updated navigation", exact: true}).click();

                /**
                 * THEN
                 * 새 버튼으로 드로어 열기 성공
                 */
                await expect(page.getByRole("dialog", {name: "Navigation", exact: true})).toBeVisible();
                expect(errors).toStrictEqual([]);
            });
        });
    });
});

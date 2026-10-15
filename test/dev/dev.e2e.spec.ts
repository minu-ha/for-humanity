import {readFile, rm, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {expect} from "@playwright/test";
import {test} from "@test/_fixture/dev";

test.describe("개발 서버", () => {
    test("[DEV-001] 문서 추가와 변경과 삭제가 브라우저에 반영되고 잘못된 문서에서 복구한다", {tag: "@high"}, async ({page, devSite}) => {
        /**
         * GIVEN
         * 실제 개발 서버와 갱신 통신이 연결된 홈
         */
        const connected = page.waitForEvent("console", (message) => message.text().includes("[vite] connected"));
        await page.goto("/");
        await connected;
        await expect(page.getByText("Initial content.", {exact: true})).toBeVisible();

        await test.step("새 문서를 추가하고 본문 변경을 반영한다", async () => {
            /**
             * WHEN
             * 문서 파일 추가와 홈 변경
             */
            await writeFile(join(devSite.root, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Added section\n");
            await expect(page.getByRole("link", {name: "Guide", exact: true}).first()).toBeVisible();
            await writeFile(join(devSite.root, "README.md"), "# Development home\n\nUpdated content.\n");

            /**
             * THEN
             * 수동 새로고침 없는 새 내용
             */
            await expect(page.getByText("Updated content.", {exact: true})).toBeVisible();
        });

        await test.step("문법 오류 동안 마지막 정상 문서를 유지하고 수정 후 복구한다", async () => {
            /**
             * WHEN
             * 잘못된 frontmatter 저장
             */
            await writeFile(join(devSite.root, "guide.md"), "---\nname: [\n---\n");
            await expect.poll(() => devSite.errors.length).toBeGreaterThan(0);

            /**
             * THEN
             * 마지막 정상 응답 유지와 파일 삭제 후 정상 갱신
             */
            const response = await page.request.get("/guide/");
            expect(await response.text()).toContain("Added section");
            await rm(join(devSite.root, "guide.md"));
            await expect(page.getByRole("link", {name: "Guide", exact: true})).toHaveCount(0);
            expect((await page.request.get("/guide/")).status()).toBe(404);
        });
    });

    test("[DEV-002] Vite 통신만 공개하고 문서 원본과 설정과 임의 파일은 제공하지 않는다", {tag: ["@high", "@negative"]}, async ({page, devSite}) => {
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
        const paths = ["/README.md", "/for-humanity.config.ts", `/@fs/${join(devSite.root, "README.md")}`, "/_fh/reload", "/src/entry/cli/cli.ts"];
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
        const connected = page.waitForEvent("console", (message) => message.text().includes("[vite] connected"));
        await page.goto("/");
        await connected;
        const home = join(devSite.root, "README.md");
        const snippet = join(devSite.root, "example.ts");
        const picture = join(devSite.root, "picture.svg");
        await writeFile(home, "# Assets\n\n<<< ./example.ts\n\n![Illustration](./picture.svg)\n\n```mermaid\ngraph LR\nA[Start] --> B[End]\n```\n");
        await expect.poll(() => devSite.errors.length).toBeGreaterThan(0);
        await expect(page.getByText("Initial content.", {exact: true})).toBeVisible();

        await test.step("빠진 파일의 추가만으로 참조와 다이어그램을 복구한다", async () => {
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

        const previousImage = await page.getByRole("img", {name: "Illustration"}).getAttribute("src");
        if (previousImage === null) throw new Error("등록 이미지 URL이 없습니다");

        await test.step("스니펫과 이미지 수정 시 새 내용과 지문을 사용한다", async () => {
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

        await test.step("참조 삭제 오류를 고친 뒤 README 삭제까지 반영한다", async () => {
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

    test("[DEV-005] 서버 종료는 갱신 연결과 파일 감시와 HTTP 포트를 해제한다", {tag: "@high"}, async ({page, devSite}) => {
        /**
         * GIVEN
         * 실제 WebSocket 연결을 가진 개발 서버
         */
        const connection = page.waitForEvent("websocket");
        await page.goto("/");
        const socket = await connection;
        const closed = socket.waitForEvent("close");

        /**
         * WHEN
         * 변경 예약 직후 개발 서버 종료
         */
        await writeFile(join(devSite.root, "README.md"), "# Closing server\n");
        await devSite.server.close();
        await closed;

        /**
         * THEN
         * 종료된 HTTP 포트와 비워진 파일 감시
         */
        expect(devSite.server.httpServer?.listening).toBe(false);
        expect(devSite.server.watcher.getWatched()).toStrictEqual({});
    });
});

test.describe("저장소 소스 개발", () => {
    test.use({source: true});

    test("[DEV-003] CSS 변경은 페이지 상태를 유지하고 TSX 변경은 서버와 브라우저에 반영한다", {tag: "@high"}, async ({page, devSite}) => {
        /**
         * GIVEN
         * 격리된 소스에서 실행하는 개발 페이지
         */
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.setViewportSize({width: 760, height: 900});
        await page.goto("/");
        await expect(page.getByText("Initial content.", {exact: true})).toBeVisible();
        await page.getByRole("button", {name: "Open navigation", exact: true}).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.getByRole("button", {name: "Close navigation", exact: true}).click();
        await page.evaluate(() => document.documentElement.setAttribute("data-dev-marker", "retained"));

        await test.step("CSS 갱신은 전체 문서를 다시 열지 않는다", async () => {
            /**
             * WHEN
             * 소스 스타일 변경
             */
            const path = join(devSite.kitRoot, "src/component/widget/shell/wg-shell.css");
            await writeFile(path, `${await readFile(path, "utf8")}\n.wg_shell__main { outline: 3px solid rgb(1, 2, 3); }\n`);

            /**
             * THEN
             * 스타일 반영과 같은 페이지 상태 유지
             */
            await expect(page.locator("main")).toHaveCSS("outline-color", "rgb(1, 2, 3)");
            await expect(page.locator("html")).toHaveAttribute("data-dev-marker", "retained");
        });

        await test.step("서버 JSX 변경은 새 HTML로 반영한다", async () => {
            /**
             * WHEN
             * 서버 셸의 언어 속성 변경
             */
            const path = join(devSite.kitRoot, "src/component/widget/shell/wg-shell.tsx");
            await writeFile(path, (await readFile(path, "utf8")).replace('<html lang="ko">', '<html lang="en">'));

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
             * WHEN
             * 클라이언트가 마운트하는 탐색 버튼 이름 변경
             */
            const path = join(devSite.kitRoot, "src/component/widget/navigation/wg-navigation.tsx");
            await writeFile(path, (await readFile(path, "utf8")).replace("aria-label={copy_nav_open}", 'aria-label="Updated navigation"'));

            /**
             * THEN
             * 새 버튼으로 드로어 열기 성공
             */
            await page.getByRole("button", {name: "Updated navigation", exact: true}).click();
            await expect(page.getByRole("dialog")).toBeVisible();
            expect(errors).toStrictEqual([]);
        });
    });
});

import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {Hono} from "hono";
import {chromium} from "playwright";

// 개인 문서 대신 임시 문서를 빌드해 실제 SSR 출력과 Hono 브라우저 런타임을 함께 검증한다.
const [channel] = process.argv.slice(2);
const root = await mkdtemp(join(tmpdir(), "for-humanity-navigation-"));
let browser;
let server;

try {
    const sections = Array.from({length: 24}, (_, index) => `## Section ${index}\n\n### Detail ${index}\n\n${"Readable context. ".repeat(40)}\n`).join("\n");
    await writeFile(join(root, "README.md"), "# Home\n\n## Start\n\n[Guide](guide.md)\n");
    await writeFile(
        join(root, "guide.md"),
        `---\nname: Guide\nlabel: Guide\ngroup: Guide\norder: 0\n---\n\n${sections}\n:::details[Folded context]\n### Hidden detail\n\nHidden context.\n:::\n`,
    );
    await writeFile(join(root, "child.md"), "---\nname: Child\nlabel: Child\ngroup: Guide\nparent: guide\norder: 1\n---\n\n## Short page\n\nText.\n");
    await Promise.all(
        Array.from({length: 40}, (_, index) =>
            writeFile(join(root, `page-${index}.md`), `---\nname: Page ${index}\nlabel: Page\ngroup: Guide\norder: ${index + 2}\n---\n\n## Read\n\nText.\n`),
        ),
    );
    execFileSync(process.execPath, ["dist/cli.js", "build", root], {stdio: "inherit"});
    const app = new Hono();
    app.use("/*", serveStatic({root: join(root, "dist")}));
    server = serve({fetch: app.fetch, hostname: "127.0.0.1", port: 0});
    await once(server, "listening");
    const address = server.address();
    assert.ok(address !== null && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch(channel === undefined ? {} : {channel});

    for (const options of [
        {viewport: {width: 1920, height: 600}},
        {viewport: {width: 1536, height: 600}, colorScheme: "dark"},
        {viewport: {width: 1535, height: 600}},
        {viewport: {width: 1024, height: 600}},
        {viewport: {width: 1023, height: 600}},
        {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true},
        {viewport: {width: 1536, height: 600}, forcedColors: "active"},
        {viewport: {width: 390, height: 844}, javaScriptEnabled: false},
        {viewport: {width: 1536, height: 600}, javaScriptEnabled: false},
    ]) {
        const context = await browser.newContext(options);
        try {
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(`${origin}/guide/`);
            const mobile = options.viewport.width < 1024;
            if (mobile && options.javaScriptEnabled !== false) await page.getByRole("button", {name: "Open navigation", exact: true}).click();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
            const outline = page.getByRole("navigation", {name: "On this page", exact: true});
            assert.equal(await outline.isVisible(), options.viewport.width >= 1536);
            const documents = page.locator('[data-navigation-scroll="documents"]');
            if (options.javaScriptEnabled === false) {
                assert.equal(await page.getByRole("link", {name: "Child", exact: true}).isVisible(), true);
                assert.equal(await page.locator("[data-navigation-toggle]:not([hidden])").count(), 0);
                assert.notEqual(await documents.evaluate((element) => getComputedStyle(element).scrollbarWidth), "none");
            } else {
                const toggle = page.locator('[data-navigation-label="Guide"]').first();
                await toggle.click();
                assert.equal(await toggle.getAttribute("aria-expanded"), "false");
                await toggle.focus();
                await page.keyboard.press("Space");
                assert.equal(await toggle.getAttribute("aria-expanded"), "true");
                if (options.viewport.width >= 1536) {
                    const width = await documents.evaluate((element) => element.getBoundingClientRect().width);
                    const outlineWidth = await page.locator('[data-navigation-scroll="outline"]').evaluate((element) => element.getBoundingClientRect().width);
                    assert.equal(width, 240);
                    assert.equal(outlineWidth, width);
                }
                if (options.forcedColors === "active") assert.equal(await documents.evaluate((element) => getComputedStyle(element).scrollbarWidth), "thin");
                if (mobile) {
                    await page.keyboard.press("Escape");
                    assert.equal(await page.locator("dialog").evaluate((element) => element.open), false);
                    assert.equal(await page.getByRole("button", {name: "Open navigation", exact: true}).evaluate((element) => element === document.activeElement), true);
                }
            }
            assert.deepEqual(errors, []);
        } finally {
            await context.close();
        }
    }

    const context = await browser.newContext({viewport: {width: 1920, height: 600}});
    try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${origin}/guide/`);
        const parent = page.locator('[data-navigation-toggle="doc:guide"]');
        await parent.click();
        const outlineBranch = page.locator('[data-navigation-toggle="outline:guide:heading:section-0"]');
        await outlineBranch.click();
        await page.evaluate(() => {
            document.querySelector('[data-navigation-scroll="documents"]').scrollTop = 200;
            document.querySelector('[data-navigation-scroll="outline"]').scrollTop = 250;
        });
        await page.waitForFunction(() => {
            const saved = JSON.parse(sessionStorage.getItem("for-humanity:navigation-scroll"));
            return saved?.state.positions.wide?.documents === 200 && saved.state.positions.wide.outline === 250;
        });
        // 외부 본문 module을 지연해도 모든 첫 프레임이 같은 저장 위치와 접힘 상태여야 한다.
        await page.addInitScript(() => {
            window.navigationFrames = [];
            let frames = 0;
            const sample = () => {
                const documents = document.querySelector('[data-navigation-scroll="documents"]');
                const outline = document.querySelector('[data-navigation-scroll="outline"]');
                const branch = document.querySelector('[data-navigation-toggle="doc:guide"]');
                const outlineBranch = document.querySelector('[data-navigation-toggle="outline:guide:heading:section-0"]');
                if (documents && outline && branch && outlineBranch) {
                    window.navigationFrames.push({
                        documents: documents.scrollTop,
                        outline: outline.scrollTop,
                        expanded: branch.getAttribute("aria-expanded"),
                        outlineExpanded: outlineBranch.getAttribute("aria-expanded"),
                    });
                }
                if (++frames < 45) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
        });
        await page.route("**/_fh/client.*.js", async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await route.continue();
        });
        await page.reload();
        await page.waitForFunction(() => window.navigationFrames.length >= 10);
        const frames = await page.evaluate(() => window.navigationFrames);
        // 소수 높이와 브라우저 scroll anchoring의 1px 반올림은 허용하되 시작점에서 튀는 프레임은 실패한다.
        const roundingTolerance = 1;
        assert.ok(
            frames.every(
                (frame) =>
                    Math.abs(frame.documents - 200) <= roundingTolerance &&
                    Math.abs(frame.outline - 250) <= roundingTolerance &&
                    frame.expanded === "false" &&
                    frame.outlineExpanded === "false",
            ),
            JSON.stringify(frames),
        );
        await page.unroute("**/_fh/client.*.js");
        await page.goto(`${origin}/page-1/`);
        assert.ok(Math.abs((await page.locator('[data-navigation-scroll="documents"]').evaluate((element) => element.scrollTop)) - 200) <= roundingTolerance);
        assert.equal(await page.locator('[data-navigation-scroll="outline"]').evaluate((element) => element.scrollTop), 0);
        assert.equal(await page.getByRole("button", {name: "Expand Guide", exact: true}).count(), 1);
        await page.goto(`${origin}/guide/#detail-10`);
        assert.equal(await outlineBranch.getAttribute("aria-expanded"), "false");
        await page.waitForFunction(() => document.querySelector('[aria-current="location"]')?.getAttribute("href") === "#detail-10");
        assert.equal(await page.locator('[aria-current="location"]').count(), 1);
        assert.equal(await page.locator('a[href="#section-10"]').getAttribute("aria-current"), null);
        assert.equal(await page.locator('a[href="#section-10"]').evaluate((element) => element.parentElement.classList.contains("wg_navigationToc__item--current")), true);

        await page.getByRole("link", {name: "Hidden detail", exact: true}).click();
        await page.waitForFunction(() => document.querySelector("details").open);
        const body = await page.locator("main").elementHandle();
        await page.setViewportSize({width: 1440, height: 600});
        await page.waitForFunction(() => document.querySelector("[data-navigation]").dataset.navigationLayout === "desktop");
        await page.evaluate(() => (document.querySelector('[data-navigation-scroll="documents"]').scrollTop = 80));
        await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("for-humanity:navigation-scroll"))?.state.positions.desktop?.documents === 80);
        const focused = page.getByRole("link", {name: "Page 10", exact: true});
        await focused.focus();
        const desktopPosition = await page.locator('[data-navigation-scroll="documents"]').evaluate((element) => element.scrollTop);
        await page.setViewportSize({width: 390, height: 844});
        await page.waitForFunction(() => document.activeElement?.hasAttribute("data-navigation-open"));
        await page.getByRole("button", {name: "Open navigation", exact: true}).click();
        await page.evaluate(() => (document.querySelector('[data-navigation-scroll="documents"]').scrollTop = 180));
        await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("for-humanity:navigation-scroll"))?.state.positions.drawer?.documents === 180);
        await page.getByRole("link", {name: "Page 10", exact: true}).focus();
        await page.setViewportSize({width: 1440, height: 600});
        await page.waitForFunction(() => document.querySelector("[data-navigation]").dataset.navigationLayout === "desktop");
        await page.waitForFunction(() => document.activeElement?.getAttribute("href") === "/page-10/");
        assert.equal(await page.locator('[data-navigation-scroll="documents"]').evaluate((element) => element.scrollTop), desktopPosition);
        assert.equal(await page.locator("dialog").evaluate((element) => element.open), false);
        assert.equal(await body.evaluate((element) => element === document.querySelector("main")), true);
        await page.setViewportSize({width: 1920, height: 600});
        await page.waitForFunction(() => document.querySelector("[data-navigation]").dataset.navigationLayout === "wide");
        await page.evaluate(() => (document.querySelector("details").open = false));
        await page.getByRole("link", {name: "Hidden detail", exact: true}).click();
        await page.waitForFunction(() => document.querySelector("details").open);
        assert.deepEqual(errors, []);
    } finally {
        await context.close();
    }

    for (const storage of ["blocked", "corrupt"]) {
        const context = await browser.newContext({viewport: {width: 1920, height: 600}});
        try {
            await context.addInitScript((mode) => {
                if (mode === "blocked") {
                    for (const key of ["localStorage", "sessionStorage"]) {
                        Object.defineProperty(window, key, {
                            get: () => {
                                throw new DOMException("Storage blocked", "SecurityError");
                            },
                        });
                    }
                } else {
                    localStorage.setItem("for-humanity:navigation-tree", "{broken");
                    sessionStorage.setItem("for-humanity:navigation-scroll", "{broken");
                }
            }, storage);
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(`${origin}/guide/`);
            const toggle = page.locator('[data-navigation-toggle="doc:guide"]');
            await toggle.click();
            await page.waitForFunction(() => document.querySelector('[data-navigation-toggle="doc:guide"]')?.getAttribute("aria-expanded") === "false");
            await toggle.click();
            await page.waitForFunction(() => document.querySelector('[data-navigation-toggle="doc:guide"]')?.getAttribute("aria-expanded") === "true");
            assert.deepEqual(errors, []);
        } finally {
            await context.close();
        }
    }

    console.log(
        "Navigation passed: responsive layout, no-JS/forced-colors fallbacks, first-frame persistence, anchors, native drawer, focus, retained main DOM and blocked/corrupt storage",
    );
} finally {
    await browser?.close();
    if (server !== undefined) await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(root, {recursive: true, force: true});
}

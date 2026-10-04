import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {build} from "esbuild";
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
    // 실제 소유 컴포넌트를 마운트·해제하는 전용 fixture · 공개 번들에는 테스트 API 없음.
    const lifecycle = await build({
        stdin: {
            contents: `
                import {flushSync} from 'hono/jsx/dom';
                import {createRoot} from 'hono/jsx/dom/client';
                import {WgShellControls} from '@/component/widget/shell-controls/wg-shell-controls';
                import {createNavigationStores} from '@/store/navigation/create-navigation-stores';
                const root = document.querySelector('[data-shell-browser-root]');
                const data = JSON.parse(document.getElementById('fh-navigation-data').textContent);
                const stores = createNavigationStores({local: () => localStorage, session: () => sessionStorage});
                window.shellFixture = {
                    mount: () => {
                        const shell = createRoot(root);
                        shell.render(<WgShellControls data={data} stores={stores} reload={true} />);
                        window.shellFixture.unmount = () => flushSync(() => shell.unmount());
                    },
                };
            `,
            loader: "tsx",
            resolveDir: process.cwd(),
        },
        bundle: true,
        platform: "browser",
        format: "iife",
        jsx: "automatic",
        jsxImportSource: "hono/jsx/dom",
        loader: {".css": "empty"},
        write: false,
    });
    const browserScript = await readFile("dist/browser.js", "utf8");
    const lifecycleHtml = (await readFile(join(root, "dist/guide/index.html"), "utf8"))
        .replace(`<script>${browserScript}</script>`, "")
        .replace("</body>", `<script>${lifecycle.outputFiles[0].text}</script></body>`);
    const app = new Hono();
    app.get("/lifecycle/", (c) => c.html(lifecycleHtml));
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
            if (mobile && options.javaScriptEnabled !== false) {
                await page.getByRole("button", {name: "Open navigation", exact: true}).click();
                assert.equal(await page.locator("dialog").evaluate((element) => element.matches(":modal")), true);
            }
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
        const scriptRequests = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("request", (request) => {
            if (request.resourceType() === "script") scriptRequests.push(request.url());
        });
        await page.goto(`${origin}/guide/`);
        const parent = page.locator('[data-navigation-toggle="doc:guide"]');
        await parent.click();
        const outlineBranch = page.locator('[data-navigation-toggle="outline:guide:heading:section-0"]');
        await outlineBranch.click();
        await page.mouse.move(500, 200);
        await page.waitForFunction(() => getComputedStyle(document.querySelector("[data-cursor-face]")).visibility === "visible");
        await page.mouse.down();
        await page.mouse.up();
        assert.equal(await page.locator("[data-cursor-face]").evaluate((element) => getComputedStyle(element).visibility), "visible");
        await page.evaluate(() => {
            document.querySelector('[data-navigation-scroll="documents"]').scrollTop = 200;
            document.querySelector('[data-navigation-scroll="outline"]').scrollTop = 250;
        });
        await page.waitForFunction(() => {
            const saved = JSON.parse(sessionStorage.getItem("for-humanity:navigation-scroll"));
            return saved?.state.positions.wide?.documents === 200 && saved.state.positions.wide.outline === 250;
        });
        // 외부 스크립트 없이 첫 프레임부터 저장 위치와 접힘 상태를 복원해야 한다.
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
        await page.reload();
        await page.waitForFunction(() => window.navigationFrames.length >= 10);
        assert.equal(await page.locator("[data-cursor-face]").evaluate((element) => getComputedStyle(element).visibility), "visible");
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
        await page.waitForFunction(() => document.querySelector("#hidden-detail .wg_prose__headingText")?.classList.contains("wg_prose__headingText--highlighted"));
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
        await page.waitForFunction(() => document.querySelector("#hidden-detail .wg_prose__headingText")?.classList.contains("wg_prose__headingText--highlighted"));
        await page.waitForFunction(() => !document.querySelector("#hidden-detail .wg_prose__headingText")?.classList.contains("wg_prose__headingText--highlighted"));
        assert.deepEqual(scriptRequests, [], "one inline entry must provide every browser behavior");
        assert.deepEqual(errors, []);
    } finally {
        await context.close();
    }

    const lifecycleContext = await browser.newContext({viewport: {width: 1920, height: 600}});
    try {
        const page = await lifecycleContext.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.addInitScript(() => {
            window.shellListeners = [];
            window.shellReloadConnections = 0;
            window.EventSource = class extends EventTarget {
                constructor() {
                    super();
                    window.shellReloadConnections++;
                }
                close() {
                    window.shellReloadConnections--;
                }
            };
            const add = EventTarget.prototype.addEventListener;
            const remove = EventTarget.prototype.removeEventListener;
            EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (this === window || this === document || this === document.documentElement || this instanceof MediaQueryList) {
                    const owned = new Error().stack.includes(`${location.origin}/lifecycle/`);
                    window.shellListeners.push({target: this, type, listener, options, removed: false, owned});
                }
                return add.call(this, type, listener, options);
            };
            EventTarget.prototype.removeEventListener = function (type, listener, options) {
                for (const entry of window.shellListeners) {
                    if (entry.target === this && entry.type === type && entry.listener === listener) entry.removed = true;
                }
                return remove.call(this, type, listener, options);
            };
        });
        await page.goto(`${origin}/lifecycle/`);
        const initialListeners = await page.evaluate(() => window.shellListeners.length);
        for (let cycle = 0; cycle < 3; cycle++) {
            await page.evaluate(() => window.shellFixture.mount());
            await page.mouse.move(500, 200);
            await page.waitForFunction(() => getComputedStyle(document.querySelector("[data-cursor-face]")).visibility === "visible");
            await page.waitForFunction(() => window.shellReloadConnections === 1);
            await page.evaluate(() => {
                location.hash = "#hidden-detail";
                dispatchEvent(new HashChangeEvent("hashchange"));
            });
            await page.waitForFunction(() => document.querySelector("#hidden-detail .wg_prose__headingText")?.classList.contains("wg_prose__headingText--highlighted"));
            const main = await page.locator("main").elementHandle();
            await page.evaluate(() => window.shellFixture.unmount());
            assert.equal(await main.evaluate((element) => element === document.querySelector("main")), true);
            assert.equal(await page.locator(".wg_prose__headingText--highlighted").count(), 0);
            assert.equal(await page.evaluate(() => window.shellReloadConnections), 0);
            const active = await page.evaluate(
                (start) =>
                    window.shellListeners
                        .slice(start)
                        .filter((entry) => entry.owned && !entry.removed && !entry.options?.signal?.aborted)
                        .map((entry) => entry.type),
                initialListeners,
            );
            assert.deepEqual(active, [], "unmount must clean every global listener and pending highlight");
        }
        // 첫 Effect frame 이전 해제도 dev 연결을 뒤늦게 열지 않아야 한다.
        await page.evaluate(() => {
            window.shellFixture.mount();
            window.shellFixture.unmount();
        });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.evaluate(() => window.shellReloadConnections), 0);
        assert.deepEqual(errors, []);
    } finally {
        await lifecycleContext.close();
    }

    const reducedContext = await browser.newContext({viewport: {width: 1920, height: 600}, reducedMotion: "reduce"});
    try {
        const page = await reducedContext.newPage();
        await page.goto(`${origin}/guide/`);
        await page.mouse.move(500, 200);
        assert.equal(await page.locator("[data-cursor-face]").evaluate((element) => getComputedStyle(element).visibility), "hidden");
    } finally {
        await reducedContext.close();
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
        "Shell passed: responsive navigation, no-JS/forced-colors fallbacks, first-frame persistence, anchors, cursor, reduced motion, lifecycle cleanup, drawer focus and blocked/corrupt storage",
    );
} finally {
    await browser?.close();
    if (server !== undefined) await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(root, {recursive: true, force: true});
}

import assert from "node:assert/strict";
import {mkdir, mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {renderToStaticMarkup} from "react-dom/server";
import {createApp} from "@/app";
import {WgShellNav} from "@/component/widget/shell/_wg-shell-nav";
import {createProcessor} from "@/content/create-processor";
import {readDocs} from "@/content/read-docs";
import {readHome} from "@/content/read-home";
import {siteConfigSchema} from "@/type/site-config";

test("documents with the same initial retain distinct URLs", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-docs-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    await Promise.all([
        writeFile(join(root, "api.md"), "---\nname: API\nlabel: Public contracts\ngroup: Reference\n---\n\n## Overview\n\nAPI guide.\n"),
        writeFile(join(root, "architecture.md"), "---\nname: Architecture\nlabel: Engine\ngroup: Development\n---\n\n## Overview\n\nEngine guide.\n"),
    ]);

    const docs = await readDocs({root, processor: createProcessor({site, root})});

    assert.deepEqual(docs.map((doc) => doc.id).toSorted(), ["api", "architecture"]);
    assert.deepEqual(docs.map((doc) => doc.data.name).toSorted(), ["API", "Architecture"]);
});

test("normalized document URL collisions still fail", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-docs-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    await Promise.all([
        writeFile(join(root, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
        writeFile(join(root, "guide.mdx"), "---\nname: Manual\nlabel: Manual\ngroup: Guide\n---\n\nText.\n"),
    ]);

    await assert.rejects(readDocs({root, processor: createProcessor({site, root})}), /문서 id가 겹친다: guide/);
});

test("navigation shows every document group in reading order without document icons", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-docs-"));
    const site = siteConfigSchema.parse({navigation: ["Getting started", "Guide"]});

    t.after(() => rm(root, {recursive: true, force: true}));
    await Promise.all([
        writeFile(join(root, "commands.md"), "---\nname: Commands\nlabel: Commands\ngroup: Getting started\n---\n\nText.\n"),
        writeFile(join(root, "writing.md"), "---\nname: Writing\nlabel: Writing\ngroup: Guide\norder: 1\n---\n\nText.\n"),
        writeFile(join(root, "parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: Guide\norder: 2\n---\n\nText.\n"),
    ]);

    const docs = await readDocs({root, processor: createProcessor({site, root})});
    const html = renderToStaticMarkup(WgShellNav({site, docs, current: "writing"}));
    const groups = [...html.matchAll(/<section\b[^>]*aria-label="([^"]+)"/g)];

    assert.deepEqual(
        groups.map((group) => group[1]),
        ["Getting started", "Guide"],
    );
    assert.doesNotMatch(html, /<details\b/);
    assert.doesNotMatch(html, /wg_shellNav__docIcon/);
    assert.doesNotMatch(html, /href="\/"/);
    assert.doesNotMatch(html, />Documents<|>Overview</);
    assert.ok(html.indexOf('href="/writing/"') < html.indexOf('href="/parts/"'));
    assert.match(html, /href="\/writing\/"[^>]*aria-current="page"/);
});

test("frontmatter supports BOM, CRLF and a closing fence at EOF", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-docs-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    await Promise.all([
        writeFile(join(root, "api.md"), "\uFEFF---\r\nname: API\r\nlabel: Public contracts\r\ngroup: Reference\r\n---\r\n\r\n예:이것\r\n"),
        writeFile(join(root, "empty.md"), "---\nname: Empty\nlabel: Empty\ngroup: Reference\n---"),
    ]);

    const docs = await readDocs({root, processor: createProcessor({site, root})});

    const api = docs.find((doc) => doc.id === "api");
    const empty = docs.find((doc) => doc.id === "empty");

    assert.ok(api);
    assert.ok(empty);
    assert.match(api.html, /예:이것/);
    assert.match(empty.html, /<h1[^>]*><span[^>]*>Empty<\/span><\/h1>/);
    assert.ok(docs.every((doc) => !doc.html.includes("wg_prose__eyebrow")));
});

test("frontmatter preserves source lines in directive errors", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-docs-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    await writeFile(join(root, "bad.md"), "---\nname: Broken\nlabel: Broken\ngroup: Guide\n---\n\n::unknown[Bad]\n");

    await assert.rejects(readDocs({root, processor: createProcessor({site, root})}), (error: unknown) => {
        assert.ok(error instanceof Error && "line" in error);
        assert.equal(error.line, 7);

        return true;
    });
});

test("a plain root README renders at home and relative home links resolve from nested docs", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-home-"));
    const site = siteConfigSchema.parse({});
    const processor = createProcessor({site, root});

    t.after(() => rm(root, {recursive: true, force: true}));
    await mkdir(join(root, "guide"));
    await Promise.all([
        writeFile(
            join(root, "readme.md"),
            '<div align="center">\n\n<img src="/favicon.svg" width="96" height="96" alt="Library face">\n\n# My library\n\nWelcome home.\n\n</div>\n\n## Start\n\n[Guide](guide/setup.md)\n\n```js\nconst ready = true;\n```\n',
        ),
        writeFile(join(root, "guide/setup.md"), "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---\n\n[Home](../readme.md#start)\n\n## Details\n"),
    ]);

    const [docs, home] = await Promise.all([readDocs({root, processor}), readHome({root, processor})]);
    const app = createApp({site, store: {docs, home}, assets: {fontCss: "", preload: [], reload: false}});
    const response = await app.request("/");
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.deepEqual(
        docs.map((doc) => doc.id),
        ["guide/setup"],
    );
    assert.match(html, /<h1[^>]*><span[^>]*>My library<\/span><\/h1>/);
    assert.match(html, /Welcome home\./);
    assert.match(html, /<div align="center">/);
    assert.match(html, /src="\/favicon\.svg" width="96" height="96"/);
    assert.match(html, /href="\/guide\/setup\/"/);
    assert.match(html, /href="#start" data-toc-link/);
    assert.match(html, /class="shiki/);
    assert.match(html, /wg_shell__brand" href="\/" aria-current="page"/);
    assert.equal([...html.matchAll(/href="\/"/g)].length, 1);
    assert.match(docs[0].html, /href="\/#start"/);
    assert.doesNotMatch(html, /wg_prose__eyebrow|pg_home__card/);
    assert.equal((await app.request("/readme/")).status, 404);
});

test("a missing README provides a creation hint without generated overview cards", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-home-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    const home = await readHome({root, processor: createProcessor({site, root})});
    const app = createApp({site, store: {docs: [], home}, assets: {fontCss: "", preload: [], reload: false}});
    const html = await (await app.request("/")).text();

    assert.equal(home, undefined);
    assert.match(html, /문서 폴더에 README\.md를 추가/);
    assert.doesNotMatch(html, /pg_home__card|>Overview<|>Documents</);
});

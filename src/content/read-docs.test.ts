import assert from "node:assert/strict";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {renderToStaticMarkup} from "react-dom/server";
import {WgShellNav} from "@/component/widget/shell/_wg-shell-nav";
import {createProcessor} from "@/content/create-processor";
import {readDocs} from "@/content/read-docs";
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

test("navigation shows every document group in reading order with default icons", async (t) => {
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
    assert.equal([...html.matchAll(/<svg\b[^>]*class="wg_shellNav__docIcon"/g)].length, docs.length + 1);
    assert.ok(html.indexOf('href="/writing/"') < html.indexOf('href="/parts/"'));
    assert.match(html, /href="\/writing\/"[^>]*aria-current="page"/);
});

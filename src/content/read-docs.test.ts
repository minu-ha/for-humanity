import assert from "node:assert/strict";
import {mkdir, mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {renderToStaticMarkup} from "react-dom/server";
import {createApp} from "@/app";
import {WgShellNav} from "@/component/widget/shell/_wg-shell-nav";
import {asset_client_path, asset_style_path} from "@/constant/asset";
import {createProcessor} from "@/content/create-processor";
import {readDocs} from "@/content/read-docs";
import {readHome} from "@/content/read-home";
import {toDocGroups} from "@/content/to-doc-groups/to-doc-groups";
import {docDataSchema} from "@/type/doc-data";
import {siteConfigSchema} from "@/type/site-config";

test("page resource URLs use the supplied content fingerprints instead of fixed cache keys", async () => {
    const site = siteConfigSchema.parse({});
    const assets = {fontCss: "", preload: [], reload: false, stylePath: "/_fh/style.abc123.css", clientPath: "/_fh/client.def456.js"};
    const app = createApp({site, store: {docs: []}, assets});
    const html = await (await app.request("/")).text();

    assert.match(html, /rel="stylesheet" href="\/_fh\/style\.abc123\.css"/);
    assert.match(html, /type="module" src="\/_fh\/client\.def456\.js"/);
    assert.doesNotMatch(html, /(?:href|src)="\/_fh\/(?:style\.css|client\.js)"/);
});

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

test("group paths preserve literal names and reject empty or invalid segments", () => {
    const data = {name: "Guide", label: "Guide"};

    assert.deepEqual(docDataSchema.parse({...data, group: " Guide "}).group, ["Guide"]);
    assert.deepEqual(docDataSchema.parse({...data, group: [" Projects ", "Example project", "Research"]}).group, ["Projects", "Example project", "Research"]);
    assert.deepEqual(docDataSchema.parse({...data, group: "Research, decisions / notes"}).group, ["Research, decisions / notes"]);

    for (const group of ["", " ", [], ["Projects", " "], ["Projects", 1], [["Projects"]], null]) {
        assert.equal(docDataSchema.safeParse({...data, group}).success, false);
    }

    assert.equal(siteConfigSchema.safeParse({navigation: ["Guide", [" Guide "]]}).success, false);
    assert.equal(siteConfigSchema.safeParse({navigation: [["Projects", ""]]}).success, false);
    assert.equal(siteConfigSchema.safeParse({navigation: []}).success, true);
});

test("nested groups follow metadata paths and keep sibling branches and document URLs distinct", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-groups-"));
    const site = siteConfigSchema.parse({navigation: ["Guide", ["Projects", "Atlas", "Research"], ["Projects", "Atlas", "Decisions"]]});

    t.after(() => rm(root, {recursive: true, force: true}));
    await Promise.all([
        writeFile(join(root, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
        writeFile(join(root, "guide-two.md"), "---\nname: More guide\nlabel: Guide\ngroup: [Guide]\n---\n\nText.\n"),
        writeFile(join(root, "overview.md"), "---\nname: Overview\nlabel: Overview\ngroup: [Projects, Atlas]\n---\n\nText.\n"),
        writeFile(join(root, "parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: [Projects, Atlas, Research]\norder: 1\n---\n\nText.\n"),
        writeFile(join(root, "authoring.md"), "---\nname: Authoring\nlabel: Authoring\ngroup: [Projects, Atlas, Research]\norder: 2\n---\n\nText.\n"),
        writeFile(join(root, "decision.md"), "---\nname: Decision\nlabel: Decision\ngroup: [Projects, Atlas, Decisions]\n---\n\nText.\n"),
        writeFile(join(root, "other.md"), "---\nname: Other research\nlabel: Other research\ngroup: [Projects, Beacon, Research]\n---\n\nText.\n"),
        writeFile(join(root, "deep.md"), "---\nname: Deep research\nlabel: Deep research\ngroup: [Projects, Atlas, Research, Archive, Drafts]\n---\n\nText.\n"),
    ]);

    const docs = await readDocs({root, processor: createProcessor({site, root})});
    const groups = toDocGroups({docs, navigation: site.navigation});

    assert.deepEqual(
        groups.map((group) => group.name),
        ["Guide", "Projects"],
    );
    assert.deepEqual(
        groups[0].docs.map((doc) => doc.id),
        ["guide", "guide-two"],
    );
    assert.deepEqual(
        groups[1].groups.map((group) => group.name),
        ["Atlas", "Beacon"],
    );
    assert.deepEqual(
        groups[1].groups[0].docs.map((doc) => doc.id),
        ["overview"],
    );
    assert.deepEqual(
        groups[1].groups[0].groups.map((group) => group.name),
        ["Research", "Decisions"],
    );
    assert.deepEqual(
        groups[1].groups[0].groups[0].docs.map((doc) => doc.id),
        ["parts", "authoring"],
    );
    assert.deepEqual(
        groups[1].groups[1].groups[0].docs.map((doc) => doc.id),
        ["other"],
    );
    assert.equal(groups[1].groups[0].groups[0].groups[0].groups[0].name, "Drafts");
    assert.deepEqual(toDocGroups({docs: docs.toReversed(), navigation: site.navigation}), groups);

    const html = renderToStaticMarkup(WgShellNav({site, docs, current: "authoring"}));

    assert.match(html, /href="\/authoring\/"[^>]*aria-current="page"/);
    assert.match(html, /Atlas<\/span><ul\b/);
    assert.match(html, /Research<\/span><ul\b/);
    assert.equal([...html.matchAll(/href="\/authoring\/"/g)].length, 1);
    assert.equal([...html.matchAll(/>Research<\/span>/g)].length, 2);
    assert.equal([...html.matchAll(/wg_shellNavList__item--current/g)].length, 3);
    assert.doesNotMatch(renderToStaticMarkup(WgShellNav({site, docs})), /aria-current="page"|wg_shellNavList__item--current/);
    assert.ok(html.indexOf('href="/parts/"') < html.indexOf('href="/authoring/"'));
    assert.doesNotMatch(html, /<details\b/);
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
    const app = createApp({site, store: {docs, home}, assets: {stylePath: asset_style_path, clientPath: asset_client_path, fontCss: "", preload: [], reload: false}});
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
    const app = createApp({site, store: {docs: [], home}, assets: {stylePath: asset_style_path, clientPath: asset_client_path, fontCss: "", preload: [], reload: false}});
    const html = await (await app.request("/")).text();

    assert.equal(home, undefined);
    assert.match(html, /문서 폴더에 README\.md를 추가/);
    assert.doesNotMatch(html, /pg_home__card|>Overview<|>Documents</);
});

test("root agent instructions stay out of the rendered documents", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-instructions-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    await mkdir(join(root, "guide"));
    await Promise.all([
        writeFile(join(root, "README.md"), "# Home\n"),
        writeFile(join(root, "AGENTS.md"), "# Agent instructions\n\nKeep commit titles concise.\n"),
        writeFile(join(root, "claude.md"), "# Claude instructions\n\nCheck documents before committing.\n"),
        writeFile(join(root, "guide/agents.md"), "---\nname: Agent guide\nlabel: Agent guide\ngroup: Guide\n---\n\nGuide.\n"),
        writeFile(join(root, "guide/claude.md"), "---\nname: Claude guide\nlabel: Claude guide\ngroup: Guide\n---\n\nGuide.\n"),
    ]);

    const docs = await readDocs({root, processor: createProcessor({site, root})});

    assert.deepEqual(new Set(docs.map((doc) => doc.id)), new Set(["guide/agents", "guide/claude"]));
});

test("relative Markdown links preserve query strings and fragments", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-links-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    await mkdir(join(root, "guide"));
    await Promise.all([
        writeFile(join(root, "README.md"), "# Home\n\n## Start\n"),
        writeFile(join(root, "api.mdx"), "---\nname: API\nlabel: API\ngroup: Guide\n---\n\n## Details\n"),
        writeFile(
            join(root, "guide/setup.md"),
            [
                "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---",
                "[API](../api.mdx?mode=compact&lang=ko#details)",
                "[Query only](../api.mdx?mode=compact)",
                "[Home](../README.md?lang=ko#start)",
                "[Reference][api]\n\n[api]: ../api.mdx?mode=reference#details",
                "[Fragment](../api.mdx#details?literal=yes)",
                "[External](https://example.com/api.md?mode=compact#details)",
                "[Absolute](/api.md?mode=compact#details)",
                "[Asset](diagram.svg?version=2#label)",
                "[Local](#details?literal=yes)",
            ].join("\n\n"),
        ),
    ]);

    const docs = await readDocs({root, processor: createProcessor({site, root})});
    const setup = docs.find((doc) => doc.id === "guide/setup");

    assert.ok(setup);
    assert.match(setup.html, /href="\/api\/\?mode=compact&#x26;lang=ko#details"/);
    assert.match(setup.html, /href="\/api\/\?mode=compact"/);
    assert.match(setup.html, /href="\/\?lang=ko#start"/);
    assert.match(setup.html, /href="\/api\/\?mode=reference#details"/);
    assert.match(setup.html, /href="\/api\/#details\?literal=yes"/);
    assert.match(setup.html, /href="https:\/\/example\.com\/api\.md\?mode=compact#details"/);
    assert.match(setup.html, /href="\/api\.md\?mode=compact#details"/);
    assert.match(setup.html, /href="diagram\.svg\?version=2#label"/);
    assert.match(setup.html, /href="#details\?literal=yes"/);
});

test("headings and contents preserve authored text without automatic numbering", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-headings-"));
    const site = siteConfigSchema.parse({});

    t.after(() => rm(root, {recursive: true, force: true}));
    await writeFile(
        join(root, "guide.md"),
        "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n### Before the first section\n\n::part[Setup]\n\n## Overview\n\n### 01. Keep this number\n\n:::details[More]\n### Nested heading\n\nBody.\n:::\n\n## Overview\n",
    );

    const docs = await readDocs({root, processor: createProcessor({site, root})});
    const app = createApp({site, store: {docs}, assets: {stylePath: asset_style_path, clientPath: asset_client_path, fontCss: "", preload: [], reload: false}});
    const html = await (await app.request("/guide/")).text();

    assert.match(html, /<h2[^>]*id="overview"[^>]*><span class="wg_prose__headingText">Overview<\/span><\/h2>/);
    assert.match(html, /<h3[^>]*id="01-keep-this-number"[^>]*><span class="wg_prose__headingText">01\. Keep this number<\/span><\/h3>/);
    assert.match(html, /href="#overview"[^>]*>Overview<\/a>/);
    assert.match(html, /href="#01-keep-this-number"[^>]*>01\. Keep this number<\/a>/);
    assert.match(html, /href="#nested-heading"[^>]*>Nested heading<\/a>/);
    assert.match(html, /href="#overview-1"[^>]*>Overview<\/a>/);
    assert.match(html, /wg_shellToc__group">Setup<\/div>/);
    assert.doesNotMatch(html, /wg_prose__num|wg_shellToc__mark/);
});

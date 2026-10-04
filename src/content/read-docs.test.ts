import assert from "node:assert/strict";
import {mkdir, mkdtemp, rm, symlink, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {createApp} from "@/app";
import {navigationDataSchema} from "@/component/widget/navigation/_constant/navigation-data-schema";
import {toNavigationData} from "@/component/widget/navigation/_function/to-navigation-data/to-navigation-data";
import {toNavigationJson} from "@/component/widget/navigation/_function/to-navigation-json";
import {WgNavigation} from "@/component/widget/navigation/wg-navigation";
import {asset_client_path, asset_style_path} from "@/constant/asset";
import {createProcessor} from "@/content/create-processor";
import {readDocs} from "@/content/read-docs";
import {readHome} from "@/content/read-home";
import {toDocGroups} from "@/content/to-doc-groups/to-doc-groups";
import {docDataSchema} from "@/type/doc-data";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 브라우저와 같은 공개 탐색 컴포넌트에서 문서 목록만 확인
 */
const toNavigationHtml = (options: Parameters<typeof toNavigationData>[0]) => {
    const markup = WgNavigation({data: toNavigationData(options)}).toString();
    const navigation = markup.match(/<nav[^>]*class="wg_navigationNav__root"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(navigation);
    return navigation;
};

test("navigation payload excludes document bodies and safely embeds authored labels", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-navigation-"));
    t.after(() => rm(root, {recursive: true, force: true}));
    const title = "</script><script>window.injected=true</script>\u2028\u2029";
    const site = siteConfigSchema.parse({title});
    await writeFile(join(root, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\nPrivate body marker.\n");
    const docs = await readDocs({root, processor: createProcessor({site, root})});
    const data = toNavigationData({site, docs, current: "guide"});
    const json = toNavigationJson(data);

    assert.equal(data.title, title);
    assert.equal(data.groups[0].docs[0].active, true);
    assert.doesNotMatch(json, /Private body marker|<|\u2028|\u2029/);
    assert.deepEqual(JSON.parse(json), data);
    assert.deepEqual(navigationDataSchema.parse(JSON.parse(json)), data);
});

test("page resource URLs use the supplied content fingerprints instead of fixed cache keys", async () => {
    const site = siteConfigSchema.parse({});
    const assets = {fontCss: "", preload: [], reload: false, navigationScript: "", stylePath: "/_fh/style.abc123.css", clientPath: "/_fh/client.def456.js"};
    const app = createApp({site, store: {docs: []}, assets});
    const html = await (await app.request("/")).text();

    assert.match(html, /rel="stylesheet" href="\/_fh\/style\.abc123\.css"/);
    assert.match(html, /type="module" src="\/_fh\/client\.def456\.js"/);
    assert.doesNotMatch(html, /(?:href|src)="\/_fh\/(?:style\.css|client\.js)"/);
});

test("navigation initialization runs after its DOM and before the document body", async () => {
    const site = siteConfigSchema.parse({});
    const navigationScript = "window.navigationFixture = true;";
    const assets = {fontCss: "", preload: [], reload: false, stylePath: asset_style_path, clientPath: asset_client_path, navigationScript};
    const html = await (await createApp({site, store: {docs: []}, assets}).request("/")).text();
    const initialization = html.indexOf(`<script>${navigationScript}</script>`);

    assert.doesNotMatch(html, /\sref="|\sonClick="/, "server HTML must not serialize browser refs or handlers");
    assert.ok(initialization > html.indexOf("fh-navigation-data"), "authored payload must be available before mounting");
    assert.ok(initialization > html.indexOf("data-navigation-drawer"), "navigation controls must exist before initialization");
    assert.ok(initialization < html.indexOf('<main class="wg_shell__main">'), "navigation must be ready before the main content is parsed");
});

test("the page outline belongs only to the right rail rather than mobile navigation", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-outline-"));
    t.after(() => rm(root, {recursive: true, force: true}));
    await writeFile(join(root, "README.md"), "# Home\n\n## Read here\n\n### More context\n\nText.\n");
    const site = siteConfigSchema.parse({});
    const home = await readHome({root, processor: createProcessor({site, root})});
    const assets = {fontCss: "", preload: [], reload: false, navigationScript: "", stylePath: asset_style_path, clientPath: asset_client_path};
    const html = await (await createApp({site, store: {docs: [], home}, assets}).request("/")).text();
    const rail = html.match(/<aside\b[^>]*data-navigation-rail=""[^>]*>([\s\S]*?)<\/aside>/)?.[1];

    assert.ok(rail, "the right rail must exist");
    assert.ok(rail.includes('data-navigation-scroll="outline"'), "the right rail must own the outline scroll area");
    assert.match(rail, /Read here/);
    assert.equal([...html.matchAll(/data-navigation-scroll="outline"/g)].length, 1);
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
    const html = toNavigationHtml({site, docs, current: "writing"});
    const groups = [...html.matchAll(/<section\b[^>]*aria-label="([^"]+)"/g)];

    assert.deepEqual(
        groups.map((group) => group[1]),
        ["Getting started", "Guide"],
    );
    assert.doesNotMatch(html, /<details\b/);
    assert.doesNotMatch(html, /wg_navigationNav__docIcon/);
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

    const html = toNavigationHtml({site, docs, current: "authoring"});

    assert.match(html, /href="\/authoring\/"[^>]*aria-current="page"/);
    assert.match(html, /Atlas<\/span><button\b[^>]*aria-expanded="true"[^>]*>−<\/button><ul\b/);
    assert.match(html, /Research<\/span><button\b[^>]*aria-expanded="true"[^>]*>−<\/button><ul\b/);
    assert.equal([...html.matchAll(/href="\/authoring\/"/g)].length, 1);
    assert.equal([...html.matchAll(/>Research<\/span>/g)].length, 2);
    assert.equal([...html.matchAll(/wg_navigationNavList__item--current/g)].length, 3);
    assert.doesNotMatch(toNavigationHtml({site, docs}), /aria-current="page"|wg_navigationNavList__item--current/);
    assert.ok(html.indexOf('href="/parts/"') < html.indexOf('href="/authoring/"'));
    assert.doesNotMatch(html, /<details\b/);
});

test("parent is an optional nonempty document ID", () => {
    const data = {name: "Child", label: "Child", group: "Guide"};

    assert.equal(docDataSchema.parse(data).parent, undefined);
    assert.equal(docDataSchema.parse({...data, parent: " guide/settings "}).parent, "guide/settings");
    for (const parent of ["", " ", null, 1, [], ["guide"]]) {
        assert.equal(docDataSchema.safeParse({...data, parent}).success, false);
    }
});

test("parent documents contain ordered descendants with independent URLs and one current page", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-parents-"));
    const site = siteConfigSchema.parse({navigation: [["Projects", "Atlas", "Guide"]]});

    t.after(() => rm(root, {recursive: true, force: true}));
    await mkdir(join(root, "guide"));
    await Promise.all([
        writeFile(join(root, "settings.md"), "---\nname: Settings\nlabel: Settings\ngroup: [Projects, Atlas, Guide]\norder: 10\n---\n\nSettings introduction.\n"),
        writeFile(join(root, "guide/site.md"), "---\nname: Site\nlabel: Site\ngroup: [Projects, Atlas, Guide]\nparent: settings\norder: 20\n---\n\nSite introduction.\n"),
        writeFile(join(root, "themes.md"), "---\nname: Themes\nlabel: Themes\ngroup: [Projects, Atlas, Guide]\nparent: settings\norder: 10\n---\n\nThemes introduction.\n"),
        writeFile(join(root, "details.md"), "---\nname: Details\nlabel: Details\ngroup: [Projects, Atlas, Guide]\nparent: guide/site\n---\n\nDeep child.\n"),
        writeFile(join(root, "writing.md"), "---\nname: Writing\nlabel: Writing\ngroup: [Projects, Atlas, Guide]\norder: 20\n---\n\nIndependent guide.\n"),
    ]);

    const docs = await readDocs({root, processor: createProcessor({site, root})});
    const groups = toDocGroups({docs, navigation: site.navigation});
    const guide = groups[0].groups[0].groups[0];

    assert.deepEqual(
        guide.docs.map((doc) => doc.id),
        ["settings", "writing"],
    );
    assert.ok(guide.docs[0].children);
    assert.deepEqual(
        guide.docs[0].children.map((doc) => doc.id),
        ["themes", "guide/site"],
    );
    assert.ok(guide.docs[0].children[1].children);
    assert.deepEqual(
        guide.docs[0].children[1].children.map((doc) => doc.id),
        ["details"],
    );
    assert.deepEqual(docs.find((doc) => doc.id === "details")?.ancestors, ["settings", "guide/site"]);
    assert.deepEqual(toDocGroups({docs: docs.toReversed(), navigation: site.navigation}), groups);

    const html = toNavigationHtml({site, docs, current: "details"});
    assert.match(html, /href="\/settings\/"[^>]*>Settings<\/a><button\b[^>]*aria-label="Collapse Settings"[^>]*>−<\/button><ul\b[^>]*aria-label="Settings"/);
    assert.match(html, /href="\/guide\/site\/"[^>]*>Site<\/a><button\b[^>]*aria-label="Collapse Site"[^>]*>−<\/button><ul\b[^>]*aria-label="Site"/);
    assert.match(html, /href="\/details\/"[^>]*aria-current="page"/);
    assert.equal([...html.matchAll(/aria-current="page"/g)].length, 1);
    assert.equal([...html.matchAll(/wg_navigationNavList__link--active/g)].length, 1);
    assert.equal([...html.matchAll(/wg_navigationNavList__item--current/g)].length, 5);
    for (const doc of docs) {
        assert.equal(html.split(`href="/${doc.id}/"`).length - 1, 1);
    }
    assert.ok(html.indexOf('href="/themes/"') < html.indexOf('href="/guide/site/"'));
    assert.doesNotMatch(toNavigationHtml({site, docs}), /aria-current="page"|wg_navigationNavList__item--current/);

    const app = createApp({
        site,
        store: {docs},
        assets: {stylePath: asset_style_path, clientPath: asset_client_path, navigationScript: "", fontCss: "", preload: [], reload: false},
    });
    for (const doc of docs) {
        assert.equal((await app.request(`/${doc.id}/`)).status, 200);
    }
});

test("relative parent IDs work with both the whole collection and a project document root", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-parents-"));
    const site = siteConfigSchema.parse({});
    t.after(() => rm(root, {recursive: true, force: true}));

    await mkdir(join(root, "project/research"), {recursive: true});
    await mkdir(join(root, "project/guide"));
    await Promise.all([
        writeFile(join(root, "project/research/README.md"), "---\nname: Research\nlabel: Research\ngroup: Guide\n---\n\nResearch introduction.\n"),
        writeFile(join(root, "project/research/parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: Guide\nparent: ./readme\n---\n\nText.\n"),
        writeFile(join(root, "project/guide/authoring.md"), "---\nname: Authoring\nlabel: Authoring\ngroup: Guide\nparent: ../research/readme\n---\n\nText.\n"),
    ]);
    for (const scope of [root, join(root, "project")]) {
        const docs = await readDocs({root: scope, processor: createProcessor({site, root: scope})});
        const parentId = scope === root ? "project/research/readme" : "research/readme";
        const groups = toDocGroups({docs, navigation: site.navigation});
        assert.deepEqual(
            groups[0].docs.map((doc) => doc.id),
            [parentId],
        );
        assert.ok(groups[0].docs[0].children);
        assert.equal(groups[0].docs[0].children.length, 2);
        assert.ok(groups[0].docs[0].children.every((doc) => doc.data.parent === parentId));
        assert.ok(groups[0].docs[0].children.every((doc) => doc.ancestors.length === 1 && doc.ancestors[0] === parentId));
    }
});

test("missing and home document parents fail when loading documents", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-parents-"));
    const site = siteConfigSchema.parse({});
    t.after(() => rm(root, {recursive: true, force: true}));

    await writeFile(join(root, "README.md"), "# Home\n");
    for (const parent of ["missing", "readme", "guide.md", "/guide/"]) {
        await writeFile(join(root, "child.md"), `---\nname: Child\nlabel: Child\ngroup: Guide\nparent: ${parent}\n---\n\nText.\n`);
        await assert.rejects(readDocs({root, processor: createProcessor({site, root})}), /부모 문서가 없다: child/);
    }
});

test("self references and cycles fail when loading documents", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-parents-"));
    const site = siteConfigSchema.parse({});
    t.after(() => rm(root, {recursive: true, force: true}));

    await writeFile(join(root, "first.md"), "---\nname: First\nlabel: First\ngroup: Guide\nparent: first\n---\n\nText.\n");
    await assert.rejects(readDocs({root, processor: createProcessor({site, root})}), /문서 parent가 순환한다/);

    await writeFile(join(root, "first.md"), "---\nname: First\nlabel: First\ngroup: Guide\nparent: second\n---\n\nText.\n");
    await writeFile(join(root, "second.md"), "---\nname: Second\nlabel: Second\ngroup: Guide\nparent: third\n---\n\nText.\n");
    await writeFile(join(root, "third.md"), "---\nname: Third\nlabel: Third\ngroup: Guide\nparent: first\n---\n\nText.\n");
    await assert.rejects(readDocs({root, processor: createProcessor({site, root})}), /문서 parent가 순환한다/);
});

test("parent and child must use the same complete group path", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-parents-"));
    const site = siteConfigSchema.parse({});
    t.after(() => rm(root, {recursive: true, force: true}));

    await writeFile(join(root, "parent.md"), "---\nname: Parent\nlabel: Parent\ngroup: [Projects, Atlas, Research]\n---\n\nText.\n");
    await writeFile(join(root, "child.md"), "---\nname: Child\nlabel: Child\ngroup: [Projects, Beacon, Research]\nparent: parent\n---\n\nText.\n");
    await assert.rejects(readDocs({root, processor: createProcessor({site, root})}), /부모 문서와 group이 다르다: child/);
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
    const app = createApp({
        site,
        store: {docs, home},
        assets: {stylePath: asset_style_path, clientPath: asset_client_path, navigationScript: "", fontCss: "", preload: [], reload: false},
    });
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
    assert.match(html, /wg_navigation__brand" href="\/" aria-current="page"/);
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
    const app = createApp({
        site,
        store: {docs: [], home},
        assets: {stylePath: asset_style_path, clientPath: asset_client_path, navigationScript: "", fontCss: "", preload: [], reload: false},
    });
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
                "[Asset](/diagram.svg?version=2#label)",
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
    assert.match(setup.html, /href="\/diagram\.svg\?version=2#label"/);
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
    const app = createApp({
        site,
        store: {docs},
        assets: {stylePath: asset_style_path, clientPath: asset_client_path, navigationScript: "", fontCss: "", preload: [], reload: false},
    });
    const html = await (await app.request("/guide/")).text();

    assert.match(html, /<h2[^>]*id="overview"[^>]*><span class="wg_prose__headingText">Overview<\/span><\/h2>/);
    assert.match(html, /<h3[^>]*id="01-keep-this-number"[^>]*><span class="wg_prose__headingText">01\. Keep this number<\/span><\/h3>/);
    assert.match(html, /href="#overview"[^>]*>Overview<\/a>/);
    assert.match(html, /href="#01-keep-this-number"[^>]*>01\. Keep this number<\/a>/);
    assert.match(html, /href="#nested-heading"[^>]*>Nested heading<\/a>/);
    assert.match(html, /href="#overview-1"[^>]*>Overview<\/a>/);
    assert.match(html, /wg_navigationToc__group">Setup<\/div>/);
    assert.doesNotMatch(html, /wg_prose__num|wg_navigationToc__mark/);
});

test("local Markdown and raw HTML images share fingerprinted assets with attachments", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-media-"));
    t.after(() => rm(root, {recursive: true, force: true}));
    await mkdir(join(root, "guide"));
    await mkdir(join(root, "img"));
    await writeFile(join(root, "img", "sample.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    await writeFile(join(root, "guide", "report.csv"), "name,value\nsample,1\n");
    await writeFile(
        join(root, "guide", "page.md"),
        '---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n![Image](../img/sample.svg)\n\n![Reference][shot]\n\n[shot]: ../img/sample.svg\n\n<img src="../img/sample.svg" alt="Raw" />\n\n[Download](report.csv?download=1#rows)\n\n![External](https://example.com/image.png)\n',
    );
    const files = new Map<string, string>();
    const docs = await readDocs({root, processor: createProcessor({site: siteConfigSchema.parse({}), root, files})});
    assert.equal(files.size, 2);
    assert.equal(docs[0].html.match(/src="\/_fh\/media\/asset\.[a-f0-9]+\.svg"/g)?.length, 3);
    assert.match(docs[0].html, /href="\/_fh\/media\/asset\.[a-f0-9]+\.csv\?download=1#rows"/);
    assert.match(docs[0].html, /src="https:\/\/example.com\/image.png"/);
});

test("missing local images and paths outside the document root fail instead of producing broken output", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-media-"));
    t.after(() => rm(root, {recursive: true, force: true}));
    await writeFile(join(root, "page.md"), "---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n![Missing](missing.png)\n");
    await assert.rejects(readDocs({root, processor: createProcessor({site: siteConfigSchema.parse({}), root})}), /자원/);
    await writeFile(join(root, "page.md"), "---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n![Outside](../outside.png)\n");
    await assert.rejects(readDocs({root, processor: createProcessor({site: siteConfigSchema.parse({}), root})}), /문서 폴더 밖/);
});

test("home images use the chosen root and symlink escapes cannot publish outside files", async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-media-"));
    const outside = await mkdtemp(join(tmpdir(), "for-humanity-outside-"));
    t.after(() => Promise.all([rm(root, {recursive: true, force: true}), rm(outside, {recursive: true, force: true})]));
    await writeFile(join(root, "local image.png"), "first");
    await writeFile(join(root, "README.md"), "# Home\n\n![Home](local%20image.png)\n");
    const files = new Map<string, string>();
    const site = siteConfigSchema.parse({});
    const home = await readHome({root, processor: createProcessor({site, root, files})});
    assert.equal(files.size, 1);
    const before = [...files.keys()][0];
    assert.ok(home?.html.includes(before));
    await writeFile(join(root, "local image.png"), "changed");
    const updated = new Map<string, string>();
    await readHome({root, processor: createProcessor({site, root, files: updated})});
    assert.notEqual([...updated.keys()][0], before);
    await writeFile(join(outside, "private.png"), "private");
    await symlink(join(outside, "private.png"), join(root, "linked.png"));
    await writeFile(join(root, "README.md"), "# Home\n\n![Private](linked.png)\n");
    await assert.rejects(readHome({root, processor: createProcessor({site, root})}), /문서 폴더 밖/);
});

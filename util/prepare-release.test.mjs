import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const script = fileURLToPath(new URL("prepare-release.mjs", import.meta.url));
const files = ["dist/cli.js", "dist/cli.css", "dist/browser.js", "src/asset/favicon.svg", "README.md", "LICENSE", "CHANGELOG.md", "src/asset/font/example.woff2"];

const fixture = async (t) => {
    const root = await mkdtemp(join(tmpdir(), "for-humanity-release-test-"));
    t.after(async () => {
        await rm(root, {recursive: true, force: true});
    });
    await mkdir(join(root, "language"));
    await mkdir(join(root, "release"));
    await writeFile(join(root, "package.json"), JSON.stringify({name: "for-humanity", version: "0.1.1", homepage: "https://for-humanity.fyi"}));
    await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n\n## 0.1.1 — 2026-10-03\n\n- Updated documentation.\n\n## 0.1.0 — 2026-10-03\n\n- First release.\n");
    for (const file of ["README.md", "language/README.ko.md"]) {
        await writeFile(join(root, file), "pnpm add -D --save-exact for-humanity@0.1.1\n");
    }
    await writeFile(
        join(root, "release/pack.json"),
        JSON.stringify([{name: "for-humanity", version: "0.1.1", filename: "for-humanity-0.1.1.tgz", integrity: "sha512-example", files: files.map((path) => ({path}))}]),
    );
    return root;
};

const run = (root, tag) => {
    const env = {...process.env};
    env.GITHUB_OUTPUT = join(root, "outputs");
    return spawnSync(process.execPath, [script, tag, join(root, "release")], {cwd: root, env, encoding: "utf8"});
};

test("prepares only the tagged changelog entry and the packed artifact", async (t) => {
    const root = await fixture(t);
    const result = run(root, "v0.1.1");
    assert.equal(result.status, 0, result.stderr);
    const notes = await readFile(join(root, "release/release-notes.md"), "utf8");
    assert.match(notes, /Updated documentation/);
    assert.doesNotMatch(notes, /First release/);
    assert.match(notes, /for-humanity@0\.1\.1/);
    assert.match(notes, /https:\/\/for-humanity\.fyi/);
    assert.match(await readFile(join(root, "outputs"), "utf8"), /version=0\.1\.1/);
});

test("accepts the package-keyed npm 12 pack report", async (t) => {
    const root = await fixture(t);
    const [pack] = JSON.parse(await readFile(join(root, "release/pack.json"), "utf8"));
    await writeFile(join(root, "release/pack.json"), JSON.stringify({[pack.name]: pack}));
    const result = run(root, "v0.1.1");
    assert.equal(result.status, 0, result.stderr);
    assert.match(await readFile(join(root, "outputs"), "utf8"), /tarball=.*for-humanity-0\.1\.1\.tgz/);
});

test("rejects a tag that differs from package.json", async (t) => {
    const root = await fixture(t);
    const result = run(root, "v0.1.2");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not match/);
});

test("rejects prerelease tags instead of publishing them as latest", async (t) => {
    const root = await fixture(t);
    const result = run(root, "v0.1.1-beta.1");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /stable version tag/);
});

test("rejects a release without its own changelog entry", async (t) => {
    const root = await fixture(t);
    await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n\n## 0.1.0 — 2026-10-03\n\n- First release.\n");
    const result = run(root, "v0.1.1");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /changelog entry/);
});

test("rejects a README that still installs the previous version", async (t) => {
    const root = await fixture(t);
    await writeFile(join(root, "language/README.ko.md"), "pnpm add -D --save-exact for-humanity@0.1.0\n");
    const result = run(root, "v0.1.1");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /README\.ko\.md/);
});

test("rejects a package without its CLI stylesheet", async (t) => {
    const root = await fixture(t);
    const pack = JSON.parse(await readFile(join(root, "release/pack.json"), "utf8"));
    pack[0].files = pack[0].files.filter((file) => file.path !== "dist/cli.css");
    await writeFile(join(root, "release/pack.json"), JSON.stringify(pack));
    const result = run(root, "v0.1.1");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /dist\/cli\.css/);
});

test("rejects a package without its browser initialization", async (t) => {
    const root = await fixture(t);
    const pack = JSON.parse(await readFile(join(root, "release/pack.json"), "utf8"));
    pack[0].files = pack[0].files.filter((file) => file.path !== "dist/browser.js");
    await writeFile(join(root, "release/pack.json"), JSON.stringify(pack));
    const result = run(root, "v0.1.1");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /dist\/browser\.js/);
});

import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdir, mkdtemp, readdir, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";

const [directory] = process.argv.slice(2);
if (directory === undefined) {
    throw new Error("Usage: node util/smoke-package.mjs <artifact directory>");
}
const artifactDirectory = resolve(directory);
const [pack] = Object.values(JSON.parse(await readFile(join(artifactDirectory, "pack.json"), "utf8")));
const consumer = await mkdtemp(join(tmpdir(), "for-humanity-consumer-"));

try {
    const nestedGroup = ["Projects", "Example", "Guide"];
    await writeFile(join(consumer, "package.json"), JSON.stringify({name: "release-consumer", private: true, type: "module"}));
    await writeFile(join(consumer, "README.md"), "# Package home\n\n[Guide](guide.md)\n");
    await writeFile(join(consumer, "AGENTS.md"), "# Private instructions\n");
    await writeFile(join(consumer, "CLAUDE.md"), "# Private instructions\n");
    await writeFile(join(consumer, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n# Guide\n\n```mermaid\nflowchart LR\n    A[Markdown] --> B[HTML]\n```\n");
    await mkdir(join(consumer, "guide"));
    await writeFile(join(consumer, "guide/options.md"), "---\nname: Options\nlabel: Options\ngroup: Guide\nparent: ../guide\n---\n\nChild page.\n");
    await writeFile(join(consumer, "guide/agents.md"), `---\nname: Nested guide\nlabel: Nested guide\ngroup: ${JSON.stringify(nestedGroup)}\n---\n\n# Nested guide\n`);
    await writeFile(join(consumer, "for-humanity.config.mjs"), `export default ${JSON.stringify({navigation: [nestedGroup, "Guide"]})};\n`);
    execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", join(artifactDirectory, pack.filename)], {cwd: consumer, stdio: "inherit"});

    const packageRoot = join(consumer, "node_modules", pack.name);
    const installed = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    assert.equal(installed.version, pack.version);
    assert.equal(await readFile(join(packageRoot, "README.md"), "utf8"), await readFile("README.md", "utf8"));
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});

    const output = join(consumer, "dist");
    const home = await readFile(join(output, "index.html"), "utf8");
    assert.match(home, /Package home/);
    const stylePath = home.match(/rel="stylesheet" href="([^"]+)"/)[1];
    const clientPath = home.match(/type="module" src="([^"]+)"/)[1];
    assert.match(stylePath, /^\/_fh\/style\.[a-f0-9]+\.css$/);
    assert.match(clientPath, /^\/_fh\/client\.[a-f0-9]+\.js$/);
    assert.equal(await readFile(join(output, stylePath), "utf8"), await readFile(join(packageRoot, "dist/cli.css"), "utf8"));
    assert.equal(await readFile(join(output, clientPath), "utf8"), await readFile(join(packageRoot, "dist/client.js"), "utf8"));
    assert.match(await readFile(join(output, "guide/index.html"), "utf8"), /<svg/);
    const nested = await readFile(join(output, "guide/agents/index.html"), "utf8");
    assert.match(nested, /Example<\/span><ul\b/);
    assert.match(nested, /Guide<\/span><ul\b/);
    assert.match(nested, /href="\/guide\/agents\/"[^>]*aria-current="page"/);
    assert.equal([...nested.matchAll(/wg_shellNavList__item--current/g)].length, nestedGroup.length);
    const child = await readFile(join(output, "guide/options/index.html"), "utf8");
    assert.match(child, /href="\/guide\/"[^>]*>Guide<\/a><ul\b[^>]*aria-label="Guide"/);
    assert.match(child, /href="\/guide\/options\/"[^>]*aria-current="page"/);
    assert.equal([...child.matchAll(/href="\/guide\/options\/"/g)].length, 1);
    assert.equal([...child.matchAll(/aria-current="page"/g)].length, 1);
    assert.equal([...child.matchAll(/wg_shellNavList__link--active/g)].length, 1);
    assert.ok(nested.indexOf('aria-label="Projects"') < nested.indexOf('aria-label="Guide"'));
    const entries = await readdir(output, {recursive: true});
    assert.ok(!entries.includes("agents/index.html"));
    assert.ok(!entries.includes("claude/index.html"));
    for (const extension of [".woff2", ".css", ".js", ".svg"]) {
        assert.ok(
            entries.some((file) => file.endsWith(extension)),
            `Missing ${extension} assets`,
        );
    }
    await writeFile(join(packageRoot, "dist/client.js"), `${await readFile(join(packageRoot, "dist/client.js"), "utf8")}\n/* changed package bytes */\n`);
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});
    const rebuilt = await readFile(join(output, "index.html"), "utf8");
    assert.equal(rebuilt.match(/rel="stylesheet" href="([^"]+)"/)[1], stylePath);
    assert.notEqual(rebuilt.match(/type="module" src="([^"]+)"/)[1], clientPath);
    const rebuiltEntries = await readdir(output, {recursive: true});
    assert.ok(!rebuiltEntries.includes(clientPath.slice(1)));
    console.log(`Installed ${pack.name}@${pack.version}: fingerprinted assets, nested groups, parent documents, pages, Mermaid and README passed`);
} finally {
    await rm(consumer, {recursive: true, force: true});
}

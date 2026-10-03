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
    await writeFile(join(consumer, "package.json"), JSON.stringify({name: "release-consumer", private: true, type: "module"}));
    await writeFile(join(consumer, "README.md"), "# Package home\n\n[Guide](guide.md)\n");
    await writeFile(join(consumer, "AGENTS.md"), "# Private instructions\n");
    await writeFile(join(consumer, "CLAUDE.md"), "# Private instructions\n");
    await writeFile(join(consumer, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n# Guide\n\n```mermaid\nflowchart LR\n    A[Markdown] --> B[HTML]\n```\n");
    await mkdir(join(consumer, "guide"));
    await writeFile(join(consumer, "guide/agents.md"), "---\nname: Nested guide\nlabel: Nested guide\ngroup: Guide\n---\n\n# Nested guide\n");
    execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", join(artifactDirectory, pack.filename)], {cwd: consumer, stdio: "inherit"});

    const packageRoot = join(consumer, "node_modules", pack.name);
    const installed = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    assert.equal(installed.version, pack.version);
    assert.equal(await readFile(join(packageRoot, "README.md"), "utf8"), await readFile("README.md", "utf8"));
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});

    const output = join(consumer, "dist");
    assert.match(await readFile(join(output, "index.html"), "utf8"), /Package home/);
    assert.match(await readFile(join(output, "guide/index.html"), "utf8"), /<svg/);
    assert.match(await readFile(join(output, "guide/agents/index.html"), "utf8"), /Nested guide/);
    const entries = await readdir(output, {recursive: true});
    assert.ok(!entries.includes("agents/index.html"));
    assert.ok(!entries.includes("claude/index.html"));
    for (const extension of [".woff2", ".css", ".js", ".svg"]) {
        assert.ok(
            entries.some((file) => file.endsWith(extension)),
            `Missing ${extension} assets`,
        );
    }
    console.log(`Installed ${pack.name}@${pack.version}: pages, Mermaid, assets and README passed`);
} finally {
    await rm(consumer, {recursive: true, force: true});
}

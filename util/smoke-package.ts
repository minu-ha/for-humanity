import assert from "node:assert/strict";
import {execFileSync, spawnSync} from "node:child_process";
import {mkdir, mkdtemp, readdir, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {packReportSchema} from "@tool/_type/pack-report";
import {packageMetadataSchema} from "@tool/_type/package-metadata";

const [directory] = process.argv.slice(2);
if (directory === undefined) {
    throw new Error("Usage: pnpm exec tsx util/smoke-package.ts <artifact directory>");
}
const artifactDirectory = resolve(directory);
const pack = packReportSchema.parse(JSON.parse(await readFile(join(artifactDirectory, "pack.json"), "utf8")));
const consumer = await mkdtemp(join(tmpdir(), "for-humanity-consumer-"));

try {
    const nestedGroup = ["Projects", "Example", "Guide"];
    await writeFile(join(consumer, "package.json"), JSON.stringify({name: "release-consumer", private: true, type: "module"}));
    await writeFile(join(consumer, "README.md"), "# Package home\n\n[Guide](guide.md)\n");
    await writeFile(join(consumer, "AGENTS.md"), "# Private instructions\n");
    await writeFile(join(consumer, "CLAUDE.md"), "# Private instructions\n");
    await writeFile(join(consumer, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n# Guide\n\n```mermaid\nflowchart LR\n    A[Markdown] --> B[HTML]\n```\n");
    await mkdir(join(consumer, "guide"));
    await mkdir(join(consumer, "images"));
    await writeFile(join(consumer, "images", "local image.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>');
    await writeFile(
        join(consumer, "guide/options.md"),
        "---\nname: Options\nlabel: Options\ngroup: Guide\nparent: ../guide\n---\n\nChild page.\n\n![Local](../images/local%20image.svg)\n\n[Expand](../images/local%20image.svg)\n",
    );
    await writeFile(join(consumer, "guide/agents.md"), `---\nname: Nested guide\nlabel: Nested guide\ngroup: ${JSON.stringify(nestedGroup)}\n---\n\n# Nested guide\n`);
    const configPath = join(consumer, "for-humanity.config.ts");
    const config = `import type {SiteConfig} from "for-humanity";\nexport default ${JSON.stringify({url: "https://docs.example.org", navigation: [nestedGroup, "Guide"]})} satisfies SiteConfig;\n`;
    await writeFile(configPath, config);
    execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", join(artifactDirectory, pack.filename)], {cwd: consumer, stdio: "inherit"});

    const packageRoot = join(consumer, "node_modules", pack.name);
    const installed = packageMetadataSchema.parse(JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8")));
    assert.equal(installed.version, pack.version);
    assert.equal(await readFile(join(packageRoot, "README.md"), "utf8"), await readFile("README.md", "utf8"));

    // 저장소 별칭·개발 의존성이 없는 소비자에서 공개 선언과 중첩 입력 타입 검증
    const compiler = resolve("node_modules/typescript/bin/tsc");
    await writeFile(
        join(consumer, "tsconfig.json"),
        JSON.stringify({compilerOptions: {strict: true, noEmit: true, target: "ESNext", module: "NodeNext", types: []}, files: ["for-humanity.config.ts"]}),
    );
    execFileSync(process.execPath, [compiler, "--project", "tsconfig.json"], {cwd: consumer, stdio: "inherit"});
    for (const invalid of [{port: "4321"}, {navigation: [false]}, {status: [{phrase: "Reviewed", kind: "unknown"}]}, {titel: "Typo"}]) {
        await writeFile(configPath, `import type {SiteConfig} from "for-humanity";\nexport default ${JSON.stringify(invalid)} satisfies SiteConfig;\n`);
        const checked = spawnSync(process.execPath, [compiler, "--project", "tsconfig.json"], {cwd: consumer, encoding: "utf8"});
        assert.equal(checked.error, undefined);
        assert.notEqual(checked.status, 0, `Invalid config must fail type checking: ${JSON.stringify(invalid)}`);
        assert.match(checked.stdout, /for-humanity\.config\.ts/);
    }
    await writeFile(configPath, config);
    const packageFiles = await readdir(packageRoot, {recursive: true});
    assert.ok(!packageFiles.some((file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file)), "consumer package must exclude repository tests");
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});

    const output = join(consumer, "dist");
    const home = await readFile(join(output, "index.html"), "utf8");
    assert.match(home, /Package home/);
    assert.equal(await readFile(join(output, "robots.txt"), "utf8"), "User-agent: *\nAllow: /\n\nSitemap: https://docs.example.org/sitemap.xml\n");
    const sitemap = await readFile(join(output, "sitemap.xml"), "utf8");
    assert.deepEqual(
        [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((entry) => entry[1]).toSorted(),
        ["https://docs.example.org/", "https://docs.example.org/guide/", "https://docs.example.org/guide/agents/", "https://docs.example.org/guide/options/"].toSorted(),
    );
    const stylePath = home.match(/rel="stylesheet" href="([^"]+)"/)?.[1];
    assert.ok(stylePath);
    assert.doesNotMatch(home, /<script\b[^>]*\bsrc=/);
    assert.match(stylePath, /^\/_fh\/style\.[a-f0-9]+\.css$/);
    assert.equal(await readFile(join(output, stylePath), "utf8"), await readFile(join(packageRoot, "dist/cli.css"), "utf8"));
    const browserScript = await readFile(join(packageRoot, "dist/browser.js"), "utf8");
    assert.ok(home.includes(`<script>${browserScript}</script>`));
    assert.ok(home.indexOf(`<script>${browserScript}</script>`) < home.indexOf('<main class="wg_shell__main">'));
    const guide = await readFile(join(output, "guide/index.html"), "utf8");
    const mermaidPath = guide.match(/data-mermaid-module="([^"]+)"/)?.[1];
    assert.ok(mermaidPath);
    assert.match(mermaidPath, /^\/_fh\/mermaid\/mermaid-[A-Za-z0-9_-]+\.js$/);
    assert.match(guide, /data-mermaid-source/);
    assert.doesNotMatch(guide, /ascii-flow/);
    assert.equal(installed.dependencies?.mermaid, undefined, "the prebuilt runtime must not require a second Mermaid installation");
    const mermaidFiles = await readdir(join(packageRoot, "dist/mermaid"));
    for (const name of mermaidFiles) {
        assert.equal(await readFile(join(output, "_fh/mermaid", name), "utf8"), await readFile(join(packageRoot, "dist/mermaid", name), "utf8"));
    }
    const nested = await readFile(join(output, "guide/agents/index.html"), "utf8");
    const nestedNavigation = nested.match(/<nav\b[^>]*class="wg_navigationNav__root"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nestedNavigation);
    assert.match(nested, /Example<\/span><ul\b/);
    assert.match(nested, /Guide<\/span><ul\b/);
    assert.match(nested, /href="\/guide\/agents\/"[^>]*aria-current="page"/);
    assert.equal([...nestedNavigation.matchAll(/wg_navigationNavList__link--active/g)].length, 1);
    const child = await readFile(join(output, "guide/options/index.html"), "utf8");
    const childNavigation = child.match(/<nav\b[^>]*class="wg_navigationNav__root"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(childNavigation);
    assert.match(child, /href="\/guide\/"[^>]*>Guide<\/a><ul\b[^>]*aria-label="Guide"/);
    assert.match(child, /href="\/guide\/options\/"[^>]*aria-current="page"/);
    const imagePath = child.match(/src="(\/_fh\/media\/asset\.[a-f0-9]+\.svg)"/)?.[1];
    assert.ok(imagePath);
    assert.equal(await readFile(join(output, imagePath), "utf8"), await readFile(join(consumer, "images", "local image.svg"), "utf8"));
    assert.ok(child.includes(`href="${imagePath}"`));
    assert.equal([...child.matchAll(/href="\/guide\/options\/"/g)].length, 1);
    assert.equal([...child.matchAll(/aria-current="page"/g)].length, 1);
    assert.equal([...childNavigation.matchAll(/wg_navigationNavList__link--active/g)].length, 1);
    assert.ok(nested.indexOf('aria-label="Projects"') < nested.indexOf('aria-label="Guide"'));
    const entries = await readdir(output, {recursive: true});
    assert.ok(!entries.includes("agents/index.html"));
    assert.ok(!entries.includes("claude/index.html"));
    for (const extension of [".woff2", ".css", ".svg"]) {
        assert.ok(
            entries.some((file) => file.endsWith(extension)),
            `Missing ${extension} assets`,
        );
    }
    const changedBrowserScript = `${browserScript}\n/* changed package bytes */\n`;
    await writeFile(join(packageRoot, "dist/browser.js"), changedBrowserScript);
    // 같은 설치에서 기존 ESM 설정도 계속 지원
    await rm(configPath);
    await writeFile(join(consumer, "for-humanity.config.mjs"), `export default ${JSON.stringify({navigation: [nestedGroup, "Guide"]})};\n`);
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});
    const rebuilt = await readFile(join(output, "index.html"), "utf8");
    assert.equal(rebuilt.match(/rel="stylesheet" href="([^"]+)"/)?.[1], stylePath);
    assert.ok(rebuilt.includes(`<script>${changedBrowserScript}</script>`));
    const rebuiltEntries = await readdir(output, {recursive: true});
    assert.ok(!rebuiltEntries.includes("robots.txt"), "removing the public URL must also remove previous crawler files");
    assert.ok(!rebuiltEntries.includes("sitemap.xml"), "projects without a public URL must not emit a sitemap");
    assert.ok(!rebuiltEntries.some((file) => file.endsWith(".js") && !file.startsWith("_fh/mermaid/")), "only the lazy Mermaid graph may emit script assets");
    await writeFile(join(consumer, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nOrdinary text.\n");
    execFileSync(process.execPath, [join(packageRoot, "dist/cli.js"), "build", "."], {cwd: consumer, stdio: "inherit"});
    assert.ok(!(await readdir(join(output, "_fh"))).includes("mermaid"), "removing all diagrams must remove the previous runtime assets");
    console.log(
        `Installed ${pack.name}@${pack.version}: public config types, TypeScript/ESM settings, fingerprinted assets, navigation, images, Mermaid, README and crawler files passed`,
    );
} finally {
    await rm(consumer, {recursive: true, force: true});
}

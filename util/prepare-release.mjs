import {appendFile, readFile, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";

const [tag, directory] = process.argv.slice(2);
if (tag === undefined || !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || directory === undefined) {
    throw new Error("Use a stable version tag and an artifact directory: node util/prepare-release.mjs v0.1.1 <directory>");
}

const metadata = JSON.parse(await readFile("package.json", "utf8"));
if (tag !== `v${metadata.version}`) {
    throw new Error(`Tag ${tag} does not match package.json version ${metadata.version}`);
}

for (const file of ["README.md", "language/README.ko.md"]) {
    const readme = await readFile(file, "utf8");
    if (!readme.includes(`pnpm add -D --save-exact ${metadata.name}@${metadata.version}\n`)) {
        throw new Error(`${file} must install ${metadata.name}@${metadata.version}`);
    }
}

const changelog = await readFile("CHANGELOG.md", "utf8");
const entry = changelog.split(/^## /m).find((section) => section.startsWith(`${metadata.version} — `));
if (entry === undefined || !entry.includes("\n\n") || entry.slice(entry.indexOf("\n\n")).trim() === "") {
    throw new Error(`Missing changelog entry for ${metadata.version}`);
}

const artifactDirectory = resolve(directory);
const [pack] = Object.values(JSON.parse(await readFile(join(artifactDirectory, "pack.json"), "utf8")));
if (pack.name !== metadata.name || pack.version !== metadata.version || pack.filename !== `${metadata.name}-${metadata.version}.tgz`) {
    throw new Error("Packed package does not match the release version");
}
const paths = new Set(pack.files.map((file) => file.path));
for (const file of ["dist/cli.js", "dist/cli.css", "dist/client.js", "src/asset/favicon.svg", "README.md", "LICENSE", "CHANGELOG.md"]) {
    if (!paths.has(file)) {
        throw new Error(`Packed package is missing ${file}`);
    }
}
if (!pack.files.some((file) => file.path.startsWith("src/asset/font/") && file.path.endsWith(".woff2"))) {
    throw new Error("Packed package is missing its self-hosted fonts");
}

const notes = join(artifactDirectory, "release-notes.md");
const installation = `pnpm add -D --save-exact ${metadata.name}@${metadata.version}`;
await writeFile(
    notes,
    `## ${entry.trim()}\n\n### Install\n\n\`\`\`sh\n${installation}\n\`\`\`\n\n[npm](https://www.npmjs.com/package/${metadata.name}/v/${metadata.version}) · [Documentation](${metadata.homepage})\n`,
);

if (process.env.GITHUB_OUTPUT !== undefined) {
    await appendFile(process.env.GITHUB_OUTPUT, `version=${metadata.version}\ntarball=${join(artifactDirectory, pack.filename)}\nintegrity=${pack.integrity}\nnotes=${notes}\n`);
}
console.log(`Prepared ${tag}: ${pack.filename}`);

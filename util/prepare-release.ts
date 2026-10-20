import {appendFile, readFile, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {packReportSchema} from "@tool/_type/pack-report";
import {packageMetadataSchema} from "@tool/_type/package-metadata";

/*
 * 릴리스 태그의 공개 준비. 버전, README, 변경 기록, 압축 파일 검증 후 릴리스 노트 생성
 */
const [tag, directory] = process.argv.slice(2);

if (tag === undefined || !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || directory === undefined) {
    throw new Error("Use a stable version tag and an artifact directory: pnpm exec tsx util/prepare-release.ts v0.1.1 <directory>");
}

const metadata = packageMetadataSchema.parse(JSON.parse(await readFile("package.json", "utf8")));
const installation = `pnpm add -D --save-exact ${metadata.name}@${metadata.version}`;

if (tag !== `v${metadata.version}`) {
    throw new Error(`Tag ${tag} does not match package.json version ${metadata.version}`);
}

// README 두 언어의 설치 명령과 태그 버전 일치
for (const file of ["README.md", "language/README.ko.md"]) {
    const readme = await readFile(file, "utf8");

    if (!readme.includes(`${installation}\n`)) {
        throw new Error(`${file} must install ${metadata.name}@${metadata.version}`);
    }
}

// 태그 버전의 변경 기록 항목 필수
const changelog = await readFile("CHANGELOG.md", "utf8");
const entry = changelog.split(/^## /m).find((section) => section.startsWith(`${metadata.version} — `));

if (entry === undefined || !entry.includes("\n\n") || entry.slice(entry.indexOf("\n\n")).trim() === "") {
    throw new Error(`Missing changelog entry for ${metadata.version}`);
}

// npm pack 보고서의 이름, 버전, 필수 파일 검증
const artifactDirectory = resolve(directory);
const pack = packReportSchema.parse(JSON.parse(await readFile(join(artifactDirectory, "pack.json"), "utf8")));

if (pack.name !== metadata.name || pack.version !== metadata.version || pack.filename !== `${metadata.name}-${metadata.version}.tgz`) {
    throw new Error("Packed package does not match the release version");
}

const paths = new Set(pack.files.map((file) => file.path));

for (const file of [
    "dist/cli.js",
    "dist/site.js",
    "dist/cli.css",
    "dist/browser.js",
    "dist/config.js",
    "dist/type/site-config.d.ts",
    "src/asset/favicon.svg",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
]) {
    if (!paths.has(file)) {
        throw new Error(`Packed package is missing ${file}`);
    }
}

if (!pack.files.some((file) => file.path.startsWith("src/asset/font/") && file.path.endsWith(".woff2"))) {
    throw new Error("Packed package is missing its self-hosted fonts");
}

// 릴리스 노트와 워크플로 출력 작성
const notes = join(artifactDirectory, "release-notes.md");

await writeFile(
    notes,
    `## ${entry.trim()}\n\n### Install\n\n\`\`\`sh\n${installation}\n\`\`\`\n\n[npm](https://www.npmjs.com/package/${metadata.name}/v/${metadata.version}) | [Documentation](${metadata.homepage})\n`,
);

if (process.env.GITHUB_OUTPUT !== undefined) {
    await appendFile(process.env.GITHUB_OUTPUT, `version=${metadata.version}\ntarball=${join(artifactDirectory, pack.filename)}\nintegrity=${pack.integrity}\nnotes=${notes}\n`);
}

console.log(`Prepared ${tag}: ${pack.filename}`);

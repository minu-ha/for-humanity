import {spawnSync} from "node:child_process";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";

/**
 * 별도 작업 폴더에서 실행할 릴리스 검증 입력
 */
interface ReleaseRunParams {
    /**
     * 임시 패키지 루트
     */
    root: string;

    /**
     * 검증할 공개 태그
     */
    tag: string;
}

/**
 * 실제 릴리스 도구 실행, 저장소 경로 별칭과 임시 출력 파일 지정
 */
const runRelease = (params: ReleaseRunParams) => {
    const env = {...process.env};

    env.TSX_TSCONFIG_PATH = resolve("tsconfig.json");
    env.GITHUB_OUTPUT = join(params.root, "outputs");

    return spawnSync(
        process.execPath,
        ["--import", import.meta.resolve("tsx"), fileURLToPath(new URL("prepare-release.ts", import.meta.url)), params.tag, join(params.root, "release")],
        {
            cwd: params.root,
            env,
            encoding: "utf8",
        },
    );
};

/**
 * 현재 버전 압축 파일의 npm pack 항목. 필수 산출물과 내장 글꼴 포함
 */
const release_pack = {
    name: "for-humanity",
    version: "0.1.1",
    filename: "for-humanity-0.1.1.tgz",
    integrity: "sha512-example",
    files: [
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
        "src/asset/font/example.woff2",
    ].map((path) => ({path})),
};

describe("릴리스 산출물", () => {
    test.beforeEach(async ({root}) => {
        await mkdir(join(root, "language"));
        await mkdir(join(root, "release"));
        await writeFile(join(root, "package.json"), JSON.stringify({name: "for-humanity", version: "0.1.1", homepage: "https://for-humanity.fyi"}));
        await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n\n## 0.1.1 — 2026-10-03\n\n- Updated documentation.\n\n## 0.1.0 — 2026-10-03\n\n- First release.\n");

        for (const file of ["README.md", "language/README.ko.md"]) {
            await writeFile(join(root, file), "pnpm add -D --save-exact for-humanity@0.1.1\n");
        }

        await writeFile(join(root, "release/pack.json"), JSON.stringify([release_pack]));
    });

    test("태그의 변경 기록과 설치 안내만 릴리스 노트로 생성한다", async ({root}) => {
        /**
         * GIVEN
         * 두 버전의 변경 기록, 현재 버전 설치 안내, npm 패키지 보고서를 둔 임시 루트
         */

        /**
         * WHEN
         * 현재 패키지 버전의 릴리스 준비
         */
        const result = runRelease({root, tag: "v0.1.1"});
        const notes = await readFile(join(root, "release/release-notes.md"), "utf8");
        const outputs = await readFile(join(root, "outputs"), "utf8");

        /**
         * THEN
         * 현재 버전의 변경 기록, 설치 주소, 워크플로 출력
         */
        expect(result.status, result.stderr).toBe(0);
        expect(notes).toMatch(/Updated documentation/);
        expect(notes).not.toMatch(/First release/);
        expect(notes).toMatch(/for-humanity@0\.1\.1/);
        expect(notes).toMatch(/https:\/\/for-humanity\.fyi/);
        expect(outputs).toMatch(/version=0\.1\.1/);
    });

    test("패키지 이름을 키로 사용하는 npm 보고서도 처리한다", async ({root}) => {
        /**
         * GIVEN
         * npm의 객체 형태 패키지 보고서
         */
        await writeFile(join(root, "release/pack.json"), JSON.stringify({[release_pack.name]: release_pack}));

        /**
         * WHEN
         * 릴리스 준비
         */
        const result = runRelease({root, tag: "v0.1.1"});
        const outputs = await readFile(join(root, "outputs"), "utf8");

        /**
         * THEN
         * 패키지 압축 파일 경로 출력
         */
        expect(result.status, result.stderr).toBe(0);
        expect(outputs).toMatch(/tarball=.*for-humanity-0\.1\.1\.tgz/);
    });

    test.for([
        {tag: "v0.1.2", error: /does not match/},
        {tag: "v0.1.1-beta.1", error: /stable version tag/},
    ])("공개할 수 없는 태그 $tag 입력은 거부한다", async (scenario, {root}) => {
        /**
         * GIVEN
         * 패키지 버전과 다르거나 정식 버전이 아닌 태그
         */

        /**
         * WHEN
         * 릴리스 준비
         */
        const result = runRelease({root, tag: scenario.tag});

        /**
         * THEN
         * 실패 종료와 원인 안내
         */
        expect(result.status).not.toBe(0);
        expect(result.stderr).toMatch(scenario.error);
    });

    test.for([
        {name: "현재 버전 기록이 없는 CHANGELOG.md", file: "CHANGELOG.md", contents: "# Changelog\n\n## 0.1.0 — 2026-10-03\n\n- First release.\n", error: /changelog entry/},
        {name: "이전 버전을 설치하는 README.ko.md", file: "language/README.ko.md", contents: "pnpm add -D --save-exact for-humanity@0.1.0\n", error: /README\.ko\.md/},
        {name: "빈 패키지 보고서", file: "release/pack.json", contents: "[]", error: /Too small/},
        {name: "형식이 잘못된 패키지 보고서", file: "release/pack.json", contents: '{"broken":null}', error: /Invalid input/},
    ])("$name 입력은 거부한다", async (scenario, {root}) => {
        /**
         * GIVEN
         * 현재 버전과 맞지 않거나 손상된 배포 정보
         */
        await writeFile(join(root, scenario.file), scenario.contents);

        /**
         * WHEN
         * 릴리스 준비
         */
        const result = runRelease({root, tag: "v0.1.1"});

        /**
         * THEN
         * 실패 종료와 파일 오류
         */
        expect(result.status).not.toBe(0);
        expect(result.stderr).toMatch(scenario.error);
    });

    test.for(["dist/site.js", "dist/cli.css", "dist/browser.js", "dist/config.js", "dist/type/site-config.d.ts"])("필수 산출물 %s가 없으면 거부한다", async (missing, {root}) => {
        /**
         * GIVEN
         * 필수 파일이 누락된 패키지 보고서
         */
        await writeFile(join(root, "release/pack.json"), JSON.stringify([{...release_pack, files: release_pack.files.filter((file) => file.path !== missing)}]));

        /**
         * WHEN
         * 릴리스 준비
         */
        const result = runRelease({root, tag: "v0.1.1"});

        /**
         * THEN
         * 누락 파일을 명시한 실패
         */
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(missing);
    });
});

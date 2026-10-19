import {spawnSync} from "node:child_process";
import {mkdir, readdir, readFile, symlink, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {loadSite} from "@/app/load-site";
import {siteConfigSchema} from "@/type/site-config";

describe("공개와 내부 문서", () => {
    test("기본 프로젝트 빌드는 공개 URL을 유지하고 내부 본문과 자원을 제외한다", async ({root}) => {
        /**
         * GIVEN
         * 공개 문서, 내부 전용 이미지와 Mermaid, 수집 대상 밖의 Markdown
         */
        await mkdir(join(root, "content/public"), {recursive: true});
        await mkdir(join(root, "content/private/asset"), {recursive: true});
        await writeFile(join(root, "for-humanity.config.ts"), 'export default {url: "https://example.org"};');
        await writeFile(join(root, "content/README.md"), "# Home\n\n[Guide](public/guide.md)");
        await writeFile(join(root, "content/public/guide.md"), "---\nname: Guide\nlabel: Public\ngroup: Guide\n---\n\nPUBLIC_BODY");
        await writeFile(
            join(root, "content/private/maintenance.md"),
            "---\nname: INTERNAL_TITLE\nlabel: INTERNAL_LABEL\ngroup: Internal\n---\n\nINTERNAL_BODY\n\n![Secret](asset/secret.svg)\n\n```mermaid\nflowchart LR\n A --> B\n```",
        );
        await writeFile(join(root, "content/private/asset/secret.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><text>INTERNAL_IMAGE</text></svg>');
        await writeFile(join(root, "content/scratch.md"), "Not a published document");

        /**
         * WHEN
         * 프로젝트 루트에서 기본 빌드, 로컬 전체 문서 스냅샷
         */
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "build"], {cwd: root, encoding: "utf8"});
        expect(result.status, result.stderr).toBe(0);
        const output = join(root, "content/dist");
        const entries = await readdir(output, {recursive: true});
        const html = await readFile(join(output, "index.html"), "utf8");
        const local = await loadSite({root: join(root, "content"), kitRoot: resolve("."), site: siteConfigSchema.parse({}), includePrivate: true});

        /**
         * THEN
         * 공개 출력 전체에서 내부 자료 제외, 로컬 전용 경로 제공
         */
        expect(html).toContain('href="/guide/"');
        expect(entries.map((entry) => entry.replaceAll("\\", "/"))).toContain("guide/index.html");
        expect(entries.some((entry) => /private|secret|mermaid|scratch/.test(entry))).toBe(false);
        expect(html).not.toContain("INTERNAL_");
        expect(await readFile(join(output, "sitemap.xml"), "utf8")).not.toContain("private");
        expect((await local.app.request("/private/maintenance/")).status).toBe(200);
        expect(await (await local.app.request("/private/maintenance/")).text()).toContain("INTERNAL_BODY");
    });

    for (const source of [
        "[Internal](../private/secret.md)",
        "[Internal](/private/secret/)",
        "![Internal](../private/secret.svg)",
        "<<< ../private/secret.ts",
        '<a href="../private/secret.md">Internal</a>',
        '<img src="/private/secret.svg">',
    ]) {
        test(`공개 문서의 내부 참조 ${source}는 원본 위치와 함께 실패한다`, async ({root}) => {
            /**
             * GIVEN
             * 공개 문서에서 내부 자료로 향하는 참조
             */
            await mkdir(join(root, "content/public"), {recursive: true});
            await mkdir(join(root, "content/private"), {recursive: true});
            await writeFile(join(root, "content/public/guide.md"), `---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n${source}`);
            for (const name of ["secret.md", "secret.svg", "secret.ts"]) await writeFile(join(root, "content/private", name), "SECRET");

            /**
             * WHEN / THEN
             * 빌드 종료 코드와 작성 위치
             */
            const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "build", root], {encoding: "utf8"});
            expect(result.status).toBe(1);
            expect(result.stderr).toContain("guide.md");
            expect(result.stderr).toContain("private");
        });
    }

    test("사용자 지정 경로에서도 공개 폴더 이름은 URL에 포함하지 않는다", async ({root}) => {
        /**
         * GIVEN
         * 기본값과 다른 세 경로와 공개 문서의 상대 링크
         */
        await mkdir(join(root, "knowledge/published/guide"), {recursive: true});
        await writeFile(join(root, "for-humanity.config.mjs"), 'export default {content: {root: "knowledge", public: "published", private: "internal"}};');
        await writeFile(join(root, "knowledge/README.md"), "# Custom\n\n[Guide](published/guide/setup.md)");
        await writeFile(join(root, "knowledge/published/guide/setup.md"), "---\nname: Setup\nlabel: Setup\ngroup: Guide\n---\n\n[Home](../../README.md)");

        /**
         * WHEN / THEN
         * 내부 폴더 없이도 사용자 경로 빌드 성공
         */
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "build", root], {encoding: "utf8"});
        expect(result.status, result.stderr).toBe(0);
        expect(await readFile(join(root, "knowledge/dist/index.html"), "utf8")).toContain('href="/guide/setup/"');
        expect(await readFile(join(root, "knowledge/dist/guide/setup/index.html"), "utf8")).toContain('href="/"');
    });

    test("공개 폴더 누락 시 루트 전체를 대신 게시하지 않는다", async ({root}) => {
        /**
         * GIVEN
         * 이전 방식의 루트 문서만 존재하는 프로젝트
         */
        await writeFile(join(root, "README.md"), "# Must not publish");

        /**
         * WHEN / THEN
         * 마이그레이션이 필요한 입력의 명시적 실패
         */
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "build", root], {encoding: "utf8"});
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("content");
    });

    test("공개 이미지의 symlink로 내부 파일을 참조하면 실패한다", async ({root}) => {
        /**
         * GIVEN
         * 공개 경로 안의 링크가 가리키는 내부 자원
         */
        await mkdir(join(root, "content/public"), {recursive: true});
        await mkdir(join(root, "content/private"), {recursive: true});
        await writeFile(join(root, "content/private/secret.svg"), "SECRET");
        await symlink(join(root, "content/private/secret.svg"), join(root, "content/public/image.svg"));
        await writeFile(join(root, "content/public/guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n![Image](image.svg)");

        /**
         * WHEN / THEN
         * 실제 파일 경로 기준 공개 범위 검사
         */
        const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "build", root], {encoding: "utf8"});
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("private");
    });
    test("내부 문서의 상대 부모와 링크는 사용자 지정 공개 폴더를 해소한다", async ({root}) => {
        /**
         * GIVEN
         * 이름이 다른 공개 폴더의 부모를 참조하는 내부 문서
         */
        await mkdir(join(root, "published"));
        await mkdir(join(root, "internal"));
        await writeFile(join(root, "published/guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nPublic guide");
        await writeFile(join(root, "internal/notes.md"), "---\nname: Notes\nlabel: Notes\ngroup: Guide\nparent: ../published/guide\n---\n\n[Guide](../published/guide.md)");

        /**
         * WHEN
         * 개발 실행의 전체 문서와 파일 상대 부모 해석
         */
        const local = await loadSite({root, kitRoot: resolve("."), site: siteConfigSchema.parse({content: {public: "published", private: "internal"}}), includePrivate: true});
        const response = await local.app.request("/private/notes/");

        /**
         * THEN
         * 공개 부모의 URL과 내부 페이지 유지
         */
        expect(response.status).toBe(200);
        expect(await response.text()).toContain('href="/guide/"');
    });
});

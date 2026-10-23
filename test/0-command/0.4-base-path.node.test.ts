import {execFileSync} from "node:child_process";
import {mkdir, readdir, readFile, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {createServer, preview} from "vite";
import {describe, expect} from "vitest";
import {toDevConfig} from "@/entry/dev/to-dev-config";
import {toPreviewConfig} from "@/entry/preview/to-preview-config";
import {siteConfigSchema} from "@/type/site-config";

describe("하위 경로 배포", () => {
    test.for(["/agent-conventions/", "/projects/uoo/"] as const)("[BASE-001] %s의 빌드, 미리보기, 개발 서버가 같은 주소를 제공한다", async (basePath, {root}) => {
        /**
         * GIVEN
         * 중첩 문서, 원시 HTML, 이미지, Mermaid와 내부 문서
         */
        await mkdir(join(root, "content/public/guide"), {recursive: true});
        await mkdir(join(root, "content/private"), {recursive: true});
        await mkdir(join(root, "content/asset"));
        await writeFile(join(root, "for-humanity.config.ts"), `export default {basePath: ${JSON.stringify(basePath)}, url: "https://example.org", cursorFace: true};\n`);
        await writeFile(join(root, "content/README.md"), "# Home\n\n[Guide](public/guide/nested.md)\n");
        await writeFile(join(root, "content/asset/image.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>');
        await writeFile(join(root, "content/private/hidden.md"), "---\nname: Hidden\nlabel: Private\ngroup: Guide\n---\n\nPrivate only.\n");
        await writeFile(
            join(root, "content/public/guide/nested.md"),
            [
                "---",
                "name: Nested",
                "label: Nested document",
                "group: Guide",
                "---",
                "",
                "[Home](../../README.md) [Root](/guide/nested/?view=1#target) [External](https://example.net/path) [Hash](#target)",
                "",
                '![Image](../../asset/image.svg) <a href="../../README.md">Raw home</a>',
                "",
                '<img src="../../asset/image.svg" srcset="../../asset/image.svg 1x, //example.net/image.svg 2x">',
                "",
                '<object data="../../asset/image.svg"></object>',
                "",
                "## Target",
                "",
                "```mermaid",
                "flowchart LR",
                "  A --> B",
                "```",
                "",
            ].join("\n"),
        );

        /**
         * WHEN
         * 실제 CLI 빌드와 하위 경로 미리보기
         */
        execFileSync(process.execPath, ["dist/cli.js", "build", root]);
        const home = await readFile(join(root, "content/dist/index.html"), "utf8");
        const page = await readFile(join(root, "content/dist/guide/nested/index.html"), "utf8");
        const sitemap = await readFile(join(root, "content/dist/sitemap.xml"), "utf8");

        /**
         * THEN
         * 출력 폴더는 유지, 사이트 안의 모든 URL에 배포 경로 적용
         */
        expect(home).toContain(`href="${basePath}guide/nested/"`);
        expect(page).toContain(`href="${basePath}"`);
        expect(page).toContain(`href="${basePath}guide/nested/?view=1#target"`);
        expect(page).toContain(`src="${basePath}favicon.svg"`);
        expect(page).toContain(`href="${basePath}_fh/`);
        expect(page).toContain(`url(${basePath}_fh/fonts/`);
        expect(page).toContain(`src="${basePath}_fh/media/`);
        expect(page).toContain(`data="${basePath}_fh/media/`);
        expect(page).toContain(`srcset="${basePath}_fh/media/`);
        expect(page).toContain(", //example.net/image.svg 2x");
        expect(page).toContain(`data-mermaid-module="${basePath}_fh/mermaid/`);
        expect(page).toContain('href="https://example.net/path"');
        expect(page).toContain('href="#target"');
        expect(page).toContain(`href="https://example.org${basePath}guide/nested/"`);
        expect(sitemap).toContain(`<loc>https://example.org${basePath}</loc>`);
        expect(sitemap).toContain(`<loc>https://example.org${basePath}guide/nested/</loc>`);
        expect(sitemap).not.toContain("hidden");
        expect(await readdir(join(root, "content/dist"))).not.toContain(basePath.split("/")[1]);

        const server = await preview(toPreviewConfig({root: join(root, "content"), port: 0, host: "localhost", basePath}));

        try {
            const origin = server.resolvedUrls?.local[0];
            if (origin === undefined) {
                throw new Error("미리보기 서버의 테스트 주소가 없습니다");
            }
            const url = new URL(origin);
            const paths = [basePath, `${basePath}guide/nested/`, `${basePath}guide/nested?view=1`, `${basePath}favicon.svg`, `${basePath}sitemap.xml`];
            for (const path of paths) {
                expect((await fetch(new URL(path, url))).status, path).toBe(200);
            }
            expect(await (await fetch(new URL(`${basePath}guide/nested/`, url))).text()).toBe(page);
            expect((await fetch(new URL(`${basePath}private/hidden/`, url))).status).toBe(404);
            expect((await fetch(new URL(`${basePath}missing/`, url))).status).toBe(404);
            expect((await fetch(new URL("/_fh/missing.js", url))).status).not.toBe(200);
        } finally {
            await server.close();
        }

        const dev = await createServer(
            toDevConfig({root: join(root, "content"), kitRoot: resolve("."), site: {...siteConfigSchema.parse({basePath}), port: 0}, source: false, includePrivate: true}),
        );

        try {
            await dev.listen();
            const origin = dev.resolvedUrls?.local[0];
            if (origin === undefined) {
                throw new Error("개발 서버의 테스트 주소가 없습니다");
            }
            const url = new URL(origin);
            const response = await fetch(new URL(`${basePath}guide/nested/`, url));
            expect(response.status).toBe(200);
            expect(await response.text()).toContain(`href="${basePath}"`);
            expect((await fetch(new URL(`${basePath}favicon.svg`, url))).status).toBe(200);
            expect((await fetch(new URL(`${basePath}private/hidden/`, url))).status).toBe(200);
        } finally {
            await dev.close();
        }
    });
});

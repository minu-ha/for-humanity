import {mkdir, symlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect, vi} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {siteConfigSchema} from "@/type/site-config";
import {logger} from "@/util/logger/logger";

/**
 * 문서 자원 수집(src/app/_function/to-processor/_rehype-assets.ts) 검증
 */
describe("문서 자원", () => {
    describe("자원 수집", () => {
        test("[AST-001] Markdown과 HTML 이미지는 첨부 파일과 내용 지문 자원을 공유한다", async ({scope}) => {
            /**
             * GIVEN
             * 로컬 이미지와 첨부 파일을 참조하는 문서
             */
            await mkdir(join(scope.publicRoot, "guide"));
            await mkdir(join(scope.publicRoot, "img"));
            await writeFile(join(scope.publicRoot, "img", "sample.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');
            await writeFile(join(scope.publicRoot, "guide", "report.csv"), "name,value\nsample,1\n");

            await writeFile(
                join(scope.publicRoot, "guide", "page.md"),
                '---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n![Image](../img/sample.svg)\n\n![Reference][shot]\n\n[shot]: ../img/sample.svg\n\n<img src="../img/sample.svg" alt="Raw" />\n\n[Download](report.csv?download=1#rows)\n\n![External](https://example.com/image.png)\n',
            );

            const files = new Map<string, string>();

            /**
             * WHEN
             * 문서 자원 처리
             */
            const docs = await readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope, files})});

            /**
             * THEN
             * Markdown, HTML 이미지와 첨부 파일의 내용 지문 자원 공유
             */
            expect(files.size).toBe(2);
            expect(docs[0].html.match(/src="\/_fh\/media\/asset\.[a-f0-9]+\.svg"/g)?.length).toBe(3);
            expect(docs[0].html).toMatch(/href="\/_fh\/media\/asset\.[a-f0-9]+\.csv\?download=1#rows"/);
            expect(docs[0].html).toMatch(/src="https:\/\/example\.com\/image\.png"/);
        });

        test("[AST-002] 홈 이미지의 내용이 바뀌면 렌더한 주소와 자원 지문을 함께 갱신한다", async ({scope}) => {
            /**
             * GIVEN
             * 로컬 이미지를 참조하는 홈
             */
            await writeFile(join(scope.root, "local image.png"), "first");
            await writeFile(join(scope.root, "README.md"), "# Home\n\n![Home](local%20image.png)\n");

            const files = new Map<string, string>();
            const site = siteConfigSchema.parse({});
            const home = await readHome({dir: scope.root, scope, processor: toProcessor({site, scope, files})});
            const before = [...files.keys()][0];

            /**
             * WHEN
             * 이미지 바이트 변경 후 홈 재처리
             */
            await writeFile(join(scope.root, "local image.png"), "changed");

            const updated = new Map<string, string>();
            const changed = await readHome({dir: scope.root, scope, processor: toProcessor({site, scope, files: updated})});
            const after = [...updated.keys()][0];

            /**
             * THEN
             * 내용 지문과 HTML 주소 동시 갱신
             */
            expect(files.size).toBe(1);
            expect(updated.size).toBe(1);
            expect(home?.html).toContain(before);
            expect(after).not.toBe(before);
            expect(changed?.html).toContain(after);
            expect(changed?.html).not.toContain(before);
        });

        test("[AST-006] 원시 HTML의 srcset, poster, video, audio, source 자원은 내용 지문 주소로 수집한다", async ({scope}) => {
            /**
             * GIVEN
             * srcset, poster, video, audio, source로 로컬 파일을 참조하는 문서
             */
            await Promise.all([
                writeFile(join(scope.publicRoot, "small.png"), "small"),
                writeFile(join(scope.publicRoot, "large.png"), "large"),
                writeFile(join(scope.publicRoot, "poster.png"), "poster"),
                writeFile(join(scope.publicRoot, "clip.mp4"), "mp4"),
                writeFile(join(scope.publicRoot, "clip.webm"), "webm"),
                writeFile(join(scope.publicRoot, "sound.mp3"), "mp3"),
            ]);

            await writeFile(
                join(scope.publicRoot, "page.md"),
                '---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n<img srcset="small.png 1x, large.png?v=2 2x" src="small.png" alt="">\n\n<picture><source srcset="large.png" type="image/png"><img src="small.png" alt=""></picture>\n\n<video src="clip.mp4" poster="poster.png"><source src="clip.webm" type="video/webm"></video>\n\n<audio src="sound.mp3"></audio>\n\n<img srcset="data:image/png;base64,AAAA 1x, https://example.com/x.png 2x" alt="">\n',
            );

            const files = new Map<string, string>();

            /**
             * WHEN
             * 문서 자원 처리
             */
            const docs = await readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope, files})});

            /**
             * THEN
             * 서술자와 쿼리를 유지한 내용 지문 주소, 외부와 data 주소 유지
             */
            expect(files.size).toBe(6);
            expect(docs[0].html).toMatch(/srcset="\/_fh\/media\/asset\.[a-f0-9]+\.png 1x, \/_fh\/media\/asset\.[a-f0-9]+\.png\?v=2 2x"/);
            expect(docs[0].html).toMatch(/<source srcset="\/_fh\/media\/asset\.[a-f0-9]+\.png"/);
            expect(docs[0].html).toMatch(/<video src="\/_fh\/media\/asset\.[a-f0-9]+\.mp4" poster="\/_fh\/media\/asset\.[a-f0-9]+\.png">/);
            expect(docs[0].html).toMatch(/<source src="\/_fh\/media\/asset\.[a-f0-9]+\.webm"/);
            expect(docs[0].html).toMatch(/<audio src="\/_fh\/media\/asset\.[a-f0-9]+\.mp3">/);
            expect(docs[0].html).toContain('srcset="data:image/png;base64,AAAA 1x, https://example.com/x.png 2x"');
        });

        test("[AST-013] 원시 HTML의 track, embed, object 자원은 내용 지문 주소로 수집한다", async ({scope}) => {
            /**
             * GIVEN
             * 자막 트랙, 삽입 PDF, 삽입 SVG를 참조하는 문서
             */
            await Promise.all([
                writeFile(join(scope.publicRoot, "clip.mp4"), "mp4"),
                writeFile(join(scope.publicRoot, "captions.vtt"), "WEBVTT\n"),
                writeFile(join(scope.publicRoot, "report.pdf"), "pdf"),
                writeFile(join(scope.publicRoot, "diagram.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>'),
            ]);

            await writeFile(
                join(scope.publicRoot, "page.md"),
                '---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n<video src="clip.mp4"><track src="captions.vtt" kind="captions" srclang="ko"></video>\n\n<embed src="report.pdf" type="application/pdf">\n\n<object data="diagram.svg" type="image/svg+xml"></object>\n',
            );

            const files = new Map<string, string>();

            /**
             * WHEN
             * 문서 자원 처리
             */
            const docs = await readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope, files})});

            /**
             * THEN
             * track, embed, object 속성의 내용 지문 주소
             */
            expect(files.size).toBe(4);
            expect(docs[0].html).toMatch(/<track src="\/_fh\/media\/asset\.[a-f0-9]+\.vtt"/);
            expect(docs[0].html).toMatch(/<embed src="\/_fh\/media\/asset\.[a-f0-9]+\.pdf"/);
            expect(docs[0].html).toMatch(/<object data="\/_fh\/media\/asset\.[a-f0-9]+\.svg"/);
        });

        test("[AST-018] 로컬 래스터 이미지는 원본 크기를 받고 작성자가 적은 크기와 SVG, 읽을 수 없는 파일은 그대로 둔다", async ({scope}) => {
            /**
             * GIVEN
             * 가로 30, 세로 20 PNG, 너비만 적은 원시 img, SVG, PNG 확장자의 텍스트 파일을 참조하는 문서
             */
            await Promise.all([
                writeFile(
                    join(scope.publicRoot, "shot.png"),
                    Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAB4AAAAUCAAAAAC/wNIYAAAAE0lEQVR42mP4jxcwjEqPSlNLGgDmOVXHNeROsQAAAABJRU5ErkJggg==", "base64"),
                ),
                writeFile(join(scope.publicRoot, "diagram.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12"/>'),
                writeFile(join(scope.publicRoot, "broken.png"), "not an image"),
            ]);

            await writeFile(
                join(scope.publicRoot, "page.md"),
                '---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n![Shot](shot.png)\n\n<img src="shot.png" alt="Sized" width="15">\n\n![Diagram](diagram.svg)\n\n![Broken](broken.png)\n',
            );

            /**
             * WHEN
             * 문서 자원 처리
             */
            const docs = await readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope, files: new Map()})});

            /**
             * THEN
             * Markdown PNG의 원본 크기, 작성자가 적은 너비 유지, SVG와 읽을 수 없는 파일의 크기 속성 없음
             */
            expect(docs[0].html).toMatch(/<img src="\/_fh\/media\/asset\.[a-f0-9]+\.png" alt="Shot" width="30" height="20">/);
            expect(docs[0].html).toMatch(/<img src="\/_fh\/media\/asset\.[a-f0-9]+\.png" alt="Sized" width="15">/);
            expect(docs[0].html).toMatch(/<img src="\/_fh\/media\/asset\.[a-f0-9]+\.svg" alt="Diagram">/);
            expect(docs[0].html).toMatch(/<img src="\/_fh\/media\/asset\.[a-f0-9]+\.png" alt="Broken">/);
        });
    });

    describe("자원 거부", () => {
        test.for([
            {caseId: "AST-003", path: "missing.png", error: /file not found/},
            {caseId: "AST-004", path: "../../outside.png", error: /Reference outside the document scope/},
        ])("[$caseId] 유효하지 않은 이미지 $path 경로를 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 잘못된 이미지 경로를 참조하는 문서
             */
            await writeFile(join(scope.publicRoot, "page.md"), `---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n![Invalid](${scenario.path})\n`);

            /**
             * WHEN
             * 문서 자원 처리
             */
            const result = readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope})});

            /**
             * THEN
             * 누락 파일과 문서 루트 밖의 자원 참조 오류
             */
            await expect(result).rejects.toThrow(scenario.error);
        });

        test("[AST-005] 심볼릭 링크가 문서 루트 밖의 이미지를 가리키면 거부한다", async ({root}) => {
            /**
             * GIVEN
             * 문서 루트 밖의 파일에 연결된 홈 이미지
             */
            const scope = {root: join(root, "content"), publicRoot: join(root, "content/public"), privateRoot: join(root, "content/private"), includePrivate: false, locales: []};

            await mkdir(scope.root);
            await writeFile(join(root, "private.png"), "private");
            await symlink(join(root, "private.png"), join(scope.root, "linked.png"));
            await writeFile(join(scope.root, "README.md"), "# Home\n\n![Private](linked.png)\n");

            /**
             * WHEN
             * 링크된 이미지를 포함한 홈 처리
             */
            const result = readHome({dir: scope.root, scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope})});

            /**
             * THEN
             * 루트 이탈 오류
             */
            await expect(result).rejects.toThrow(/Reference outside the document scope/);
        });

        test.for([
            {caseId: "AST-007", source: '<img srcset="present.png 1x, missing.png 2x" alt="">', error: /Invalid asset: missing\.png \(file not found\)/},
            {caseId: "AST-008", source: '<video src="present.mp4" poster="missing.png"></video>', error: /Invalid asset: missing\.png \(file not found\)/},
            {caseId: "AST-009", source: '<video><source src="missing.webm"></video>', error: /Invalid asset: missing\.webm \(file not found\)/},
            {caseId: "AST-010", source: '<video src="present.mov"></video>', error: /Invalid asset: present\.mov \(unsupported video or audio format\)/},
            {caseId: "AST-011", source: "![Document](present.pdf)", error: /Invalid asset: present\.pdf \(unsupported image format\)/},
        ])("[$caseId] 잘못된 자원 참조 $source 입력은 작성 위치와 함께 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 없는 파일이나 지원하지 않는 형식을 참조하는 문서
             */
            await Promise.all(["present.png", "present.mp4", "present.mov", "present.pdf"].map((name) => writeFile(join(scope.publicRoot, name), name)));
            await writeFile(join(scope.publicRoot, "page.md"), `---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n${scenario.source}\n`);

            /**
             * WHEN
             * 문서 자원 처리
             */
            const result = readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope})});

            /**
             * THEN
             * 자원 오류와 원본 행 번호
             */
            await expect(result).rejects.toThrow(scenario.error);
            await expect(result).rejects.toHaveProperty("line", 7);
        });

        test.for([
            {caseId: "AST-014", source: '<video><track src="captions.srt"></video>', error: /Invalid asset: captions\.srt \(unsupported text track format\)/},
            {caseId: "AST-015", source: '<embed src="data.json">', error: /Invalid asset: data\.json \(unsupported embedded file format\)/},
            {caseId: "AST-016", source: '<object data="missing.pdf"></object>', error: /Invalid asset: missing\.pdf \(file not found\)/},
        ])("[$caseId] 잘못된 삽입 자원 $source 입력은 작성 위치와 함께 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 지원하지 않는 형식이나 없는 파일을 가리키는 track, embed, object
             */
            await Promise.all(["captions.srt", "data.json"].map((name) => writeFile(join(scope.publicRoot, name), name)));
            await writeFile(join(scope.publicRoot, "page.md"), `---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n${scenario.source}\n`);

            /**
             * WHEN
             * 문서 자원 처리
             */
            const result = readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope})});

            /**
             * THEN
             * 자원 오류와 원본 행 번호
             */
            await expect(result).rejects.toThrow(scenario.error);
            await expect(result).rejects.toHaveProperty("line", 7);
        });
    });

    describe("배포하지 않는 파일", () => {
        test("[AST-012] 배포 형식이 아닌 로컬 파일 링크는 작성 위치와 함께 경고한다", async ({scope}) => {
            /**
             * GIVEN
             * 소스 파일, 폴더, 페이지 기준 주소를 가리키는 Markdown과 원시 HTML 링크
             */
            const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);

            await writeFile(join(scope.publicRoot, "code.ts"), "export {};\n");

            await writeFile(
                join(scope.publicRoot, "page.md"),
                '---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n[Source](code.ts)\n\n<a href="code.ts#L1">Raw</a>\n\n[Folder](./)\n\n[Page](../setup/)\n',
            );

            /**
             * WHEN
             * 문서 자원 처리
             */
            const docs = await readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope})});

            /**
             * THEN
             * 원문 링크 유지와 파일을 가리키는 두 링크의 경고
             */
            expect(docs[0].html).toContain('href="code.ts"');

            expect(warn.mock.calls).toStrictEqual([
                [`${join("public", "page.md")}:7 Link to a local file that is not published: code.ts`],
                [`${join("public", "page.md")}:9 Link to a local file that is not published: code.ts#L1`],
            ]);
        });

        test("[AST-017] 로컬 파일을 가리키는 iframe은 작성 위치와 함께 경고한다", async ({scope}) => {
            /**
             * GIVEN
             * 로컬 HTML, 로컬 PDF, 외부 주소, 없는 파일을 가리키는 iframe
             */
            const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);

            await Promise.all([writeFile(join(scope.publicRoot, "widget.html"), "<p>Widget</p>\n"), writeFile(join(scope.publicRoot, "report.pdf"), "pdf")]);

            await writeFile(
                join(scope.publicRoot, "page.md"),
                '---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n<iframe src="widget.html"></iframe>\n\n<iframe src="report.pdf"></iframe>\n\n<iframe src="https://example.com/"></iframe>\n\n<iframe src="missing.html"></iframe>\n',
            );

            /**
             * WHEN
             * 문서 자원 처리
             */
            const docs = await readDocs({scope, processor: toProcessor({site: siteConfigSchema.parse({}), scope})});

            /**
             * THEN
             * 원문 주소 유지와 로컬 파일을 가리키는 두 iframe의 경고
             */
            expect(docs[0].html).toContain('<iframe src="widget.html"></iframe>');

            expect(warn.mock.calls).toStrictEqual([
                [`${join("public", "page.md")}:7 Link to a local file that is not published: widget.html`],
                [`${join("public", "page.md")}:9 Link to a local file that is not published: report.pdf`],
            ]);
        });
    });
});

import {mkdir, symlink, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {createProcessor} from "@/app/_function/create-processor/create-processor";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {siteConfigSchema} from "@/type/site-config";

describe("문서 자원", () => {
    test("Markdown과 HTML 이미지는 첨부 파일과 내용 지문 자원을 공유한다", async ({scope}) => {
        /**
         * GIVEN
         * 지역 자원과 문서 입력
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
        const docs = await readDocs({scope, processor: createProcessor({site: siteConfigSchema.parse({}), scope, files})});

        /**
         * THEN
         * Markdown, HTML 이미지와 첨부 파일의 내용 지문 자원 공유
         */
        expect(files.size).toBe(2);
        expect(docs[0].html.match(/src="\/_fh\/media\/asset\.[a-f0-9]+\.svg"/g)?.length).toBe(3);
        expect(docs[0].html).toMatch(/href="\/_fh\/media\/asset\.[a-f0-9]+\.csv\?download=1#rows"/);
        expect(docs[0].html).toMatch(/src="https:\/\/example.com\/image.png"/);
    });

    test.for([
        {path: "missing.png", error: /file not found/},
        {path: "../../outside.png", error: /Reference outside the document scope/},
    ])("유효하지 않은 이미지 $path 경로를 거부한다", async (scenario, {scope}) => {
        /**
         * GIVEN
         * 지역 자원과 문서 입력
         */
        await writeFile(join(scope.publicRoot, "page.md"), `---\nname: Media\nlabel: Media\ngroup: Guide\n---\n\n![Invalid](${scenario.path})\n`);

        /**
         * WHEN
         * 문서 자원 처리
         */
        const result = readDocs({scope, processor: createProcessor({site: siteConfigSchema.parse({}), scope})});

        /**
         * THEN
         * 누락 파일과 문서 루트 밖의 자원 참조 오류
         */
        await expect(result).rejects.toThrow(scenario.error);
    });

    test("홈 이미지의 내용이 바뀌면 렌더한 주소와 자원 지문을 함께 갱신한다", async ({scope}) => {
        /**
         * GIVEN
         * 지역 자원과 문서 입력
         */
        await writeFile(join(scope.root, "local image.png"), "first");
        await writeFile(join(scope.root, "README.md"), "# Home\n\n![Home](local%20image.png)\n");

        const files = new Map<string, string>();
        const site = siteConfigSchema.parse({});
        const home = await readHome({scope, processor: createProcessor({site, scope, files})});
        const before = [...files.keys()][0];

        /**
         * WHEN
         * 이미지 바이트 변경 후 홈 재처리
         */
        await writeFile(join(scope.root, "local image.png"), "changed");

        const updated = new Map<string, string>();
        const changed = await readHome({scope, processor: createProcessor({site, scope, files: updated})});
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

    test("심볼릭 링크가 문서 루트 밖의 이미지를 가리키면 거부한다", async ({root}) => {
        /**
         * GIVEN
         * 문서 루트 밖의 파일에 연결된 홈 이미지
         */
        const scope = {root: join(root, "content"), publicRoot: join(root, "content/public"), privateRoot: join(root, "content/private"), includePrivate: false};

        await mkdir(scope.root);
        await writeFile(join(root, "private.png"), "private");
        await symlink(join(root, "private.png"), join(scope.root, "linked.png"));
        await writeFile(join(scope.root, "README.md"), "# Home\n\n![Private](linked.png)\n");

        /**
         * WHEN
         * 링크된 이미지를 포함한 홈 처리
         */
        const result = readHome({scope, processor: createProcessor({site: siteConfigSchema.parse({}), scope})});

        /**
         * THEN
         * 루트 이탈 오류
         */
        await expect(result).rejects.toThrow(/Reference outside the document scope/);
    });
});

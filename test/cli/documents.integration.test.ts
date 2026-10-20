import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {siteConfigSchema} from "@/type/site-config";

describe("문서 로드", () => {
    test("첫 글자가 같은 문서도 서로 다른 주소를 유지한다", async ({scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        await Promise.all([
            writeFile(join(scope.publicRoot, "api.md"), "---\nname: API\nlabel: Public contracts\ngroup: Reference\n---\n\n## Overview\n\nAPI guide.\n"),
            writeFile(join(scope.publicRoot, "architecture.md"), "---\nname: Architecture\nlabel: Engine\ngroup: Development\n---\n\n## Overview\n\nEngine guide.\n"),
        ]);

        /**
         * WHEN
         * 문서 로드
         */
        const docs = await readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 첫 글자가 같은 문서도 서로 다른 주소를 유지한 결과
         */
        expect(docs.map((doc) => doc.id).toSorted()).toStrictEqual(["api", "architecture"]);
        expect(docs.map((doc) => doc.data.name).toSorted()).toStrictEqual(["API", "Architecture"]);
    });

    test("정규화한 문서 주소가 겹치면 로드를 거부한다", async ({scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        await Promise.all([
            writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
            writeFile(join(scope.publicRoot, "guide.mdx"), "---\nname: Manual\nlabel: Manual\ngroup: Guide\n---\n\nText.\n"),
        ]);

        /**
         * WHEN
         * 문서 로드
         */
        const result = readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 정규화한 문서 주소가 겹치면 로드를 거부한 결과
         */
        await expect(result).rejects.toThrow(/Duplicate document ids: guide/);
    });

    test.for(["missing", "readme", "guide.md", "/guide/"])("찾을 수 없는 부모 %s를 거부한다", async (parent, {scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        await writeFile(join(scope.root, "README.md"), "# Home\n");
        await writeFile(join(scope.publicRoot, "child.md"), `---\nname: Child\nlabel: Child\ngroup: Guide\nparent: ${parent}\n---\n\nText.\n`);

        /**
         * WHEN
         * 문서 로드
         */
        const result = readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 존재하지 않거나 홈페이지를 가리키는 부모를 거부한 결과
         */
        await expect(result).rejects.toThrow(/Parent document not found: child/);
    });

    test.for([
        {name: "자기 참조", parents: {first: "first"}},
        {name: "세 문서의 순환 참조", parents: {first: "second", second: "third", third: "first"}},
    ])("부모의 $name 관계를 거부한다", async (scenario, {scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        for (const [name, parent] of Object.entries(scenario.parents)) {
            await writeFile(join(scope.publicRoot, `${name}.md`), `---\nname: ${name}\nlabel: ${name}\ngroup: Guide\nparent: ${parent}\n---\n\nText.\n`);
        }

        /**
         * WHEN
         * 문서 로드
         */
        const result = readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 부모의 자기 참조와 순환 참조를 거부한 결과
         */
        await expect(result).rejects.toThrow(/Circular document parents/);
    });

    test("부모와 자식의 전체 묶음 경로가 다르면 거부한다", async ({scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        await writeFile(join(scope.publicRoot, "parent.md"), "---\nname: Parent\nlabel: Parent\ngroup: [Projects, Atlas, Research]\n---\n\nText.\n");
        await writeFile(join(scope.publicRoot, "child.md"), "---\nname: Child\nlabel: Child\ngroup: [Projects, Beacon, Research]\nparent: parent\n---\n\nText.\n");

        /**
         * WHEN
         * 문서 로드
         */
        const result = readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 부모와 자식의 전체 묶음 경로가 다르면 거부한 결과
         */
        await expect(result).rejects.toThrow(/Parent document is in another group: child/);
    });

    test("문서 메타는 BOM과 CRLF와 파일 끝의 닫는 구분자를 처리한다", async ({scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        await Promise.all([
            writeFile(join(scope.publicRoot, "api.md"), "\uFEFF---\r\nname: API\r\nlabel: Public contracts\r\ngroup: Reference\r\n---\r\n\r\n예:이것\r\n"),
            writeFile(join(scope.publicRoot, "empty.md"), "---\nname: Empty\nlabel: Empty\ngroup: Reference\n---"),
        ]);

        /**
         * WHEN
         * 문서 로드
         */
        const docs = await readDocs({scope, processor: toProcessor({site, scope})});

        const api = docs.find((doc) => doc.id === "api");
        const empty = docs.find((doc) => doc.id === "empty");

        /**
         * THEN
         * 문서 메타는 BOM과 CRLF와 파일 끝의 닫는 구분자를 처리한 결과
         */
        expect(api?.html).toMatch(/예:이것/);
        expect(empty?.html).toMatch(/<h1[^>]*><span[^>]*>Empty<\/span><\/h1>/);

        for (const doc of docs) {
            expect(doc.html).not.toContain("wg_article__eyebrow");
        }
    });

    test("문서 지시문 오류는 메타를 포함한 원본 행 번호를 유지한다", async ({scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        await writeFile(join(scope.publicRoot, "bad.md"), "---\nname: Broken\nlabel: Broken\ngroup: Guide\n---\n\n::unknown[Bad]\n");

        /**
         * WHEN
         * 문서 로드
         */
        const result = readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 문서 지시문 오류는 메타를 포함한 원본 행 번호를 유지한 결과
         */
        await expect(result).rejects.toHaveProperty("line", 7);
    });

    test("문서 폴더 안의 생성물, 저장소, 설치 폴더는 문서로 수집하지 않는다", async ({scope}) => {
        /**
         * GIVEN
         * 대소문자가 다른 예약 폴더 안의 Markdown과 일반 문서
         */
        const site = siteConfigSchema.parse({});

        for (const folder of ["guide/dist", "guide/Node_Modules", ".GIT"]) {
            await mkdir(join(scope.publicRoot, folder), {recursive: true});
            await writeFile(join(scope.publicRoot, folder, "notes.md"), "---\nname: Notes\nlabel: Notes\ngroup: Guide\n---\n\nText.\n");
        }

        await writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n");

        /**
         * WHEN
         * 문서 로드
         */
        const docs = await readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 예약 폴더 밖의 문서만 수집한 결과
         */
        expect(docs.map((doc) => doc.id)).toStrictEqual(["guide"]);
    });

    test("루트 에이전트 지침은 제외하고 하위 폴더의 같은 이름 문서는 표시한다", async ({scope}) => {
        /**
         * GIVEN
         * 문서 파일과 메타 입력
         */
        const site = siteConfigSchema.parse({});

        await mkdir(join(scope.publicRoot, "guide"));

        await Promise.all([
            writeFile(join(scope.root, "README.md"), "# Home\n"),
            writeFile(join(scope.root, "AGENTS.md"), "# Agent instructions\n\nKeep commit titles concise.\n"),
            writeFile(join(scope.root, "claude.md"), "# Claude instructions\n\nCheck documents before committing.\n"),
            writeFile(join(scope.publicRoot, "guide/agents.md"), "---\nname: Agent guide\nlabel: Agent guide\ngroup: Guide\n---\n\nGuide.\n"),
            writeFile(join(scope.publicRoot, "guide/claude.md"), "---\nname: Claude guide\nlabel: Claude guide\ngroup: Guide\n---\n\nGuide.\n"),
        ]);

        /**
         * WHEN
         * 문서 로드
         */
        const docs = await readDocs({scope, processor: toProcessor({site, scope})});

        /**
         * THEN
         * 루트 에이전트 지침은 제외하고 하위 폴더의 같은 이름 문서는 표시한 결과
         */
        expect(new Set(docs.map((doc) => doc.id))).toStrictEqual(new Set(["guide/agents", "guide/claude"]));
    });
});

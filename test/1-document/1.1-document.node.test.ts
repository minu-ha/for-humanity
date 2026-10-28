import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {describe, expect} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {siteConfigSchema} from "@/type/site-config";

/**
 * 문서 수집, 주소, 부모 관계(src/app/_function/read-docs.ts) 검증
 */
describe("문서", () => {
    describe("문서 주소", () => {
        test("[DOC-001] 첫 글자가 같은 문서도 서로 다른 주소를 유지한다", async ({scope}) => {
            /**
             * GIVEN
             * 첫 글자가 같은 두 문서
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
             * 문서마다 다른 주소와 이름
             */
            expect(docs.map((doc) => doc.id).toSorted()).toStrictEqual(["api", "architecture"]);
            expect(docs.map((doc) => doc.data.name).toSorted()).toStrictEqual(["API", "Architecture"]);
        });

        test("[DOC-002] 정규화한 문서 주소가 겹치면 로드를 거부한다", async ({scope}) => {
            /**
             * GIVEN
             * 확장자만 다른 같은 이름의 두 문서
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
             * 겹친 주소를 알리는 로드 오류
             */
            await expect(result).rejects.toThrow(/Duplicate document ids: guide/);
        });
    });

    describe("부모 문서", () => {
        test.for([
            {caseId: "DOC-003", parent: "missing"},
            {caseId: "DOC-004", parent: "readme"},
            {caseId: "DOC-005", parent: "guide.md"},
            {caseId: "DOC-006", parent: "/guide/"},
        ])("[$caseId] 찾을 수 없는 부모 $parent 입력은 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 찾을 수 없는 부모를 지정한 문서
             */
            const site = siteConfigSchema.parse({});

            await writeFile(join(scope.root, "README.md"), "# Home\n");
            await writeFile(join(scope.publicRoot, "child.md"), `---\nname: Child\nlabel: Child\ngroup: Guide\nparent: ${scenario.parent}\n---\n\nText.\n`);

            /**
             * WHEN
             * 문서 로드
             */
            const result = readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 부모를 찾지 못한 문서를 알리는 로드 오류
             */
            await expect(result).rejects.toThrow(/Parent document not found: child/);
        });

        test.for([
            {caseId: "DOC-007", name: "자기 참조", parents: {first: "first"}},
            {caseId: "DOC-008", name: "세 문서의 순환 참조", parents: {first: "second", second: "third", third: "first"}},
        ])("[$caseId] 부모의 $name 관계를 거부한다", async (scenario, {scope}) => {
            /**
             * GIVEN
             * 자기 자신이나 순환 경로를 부모로 지정한 문서
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
             * 순환 경로를 알리는 로드 오류
             */
            await expect(result).rejects.toThrow(/Circular document parents/);
        });

        test("[DOC-009] 부모와 자식의 전체 묶음 경로가 다르면 거부한다", async ({scope}) => {
            /**
             * GIVEN
             * 묶음 경로가 다른 부모와 자식 문서
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
             * 다른 묶음의 부모를 알리는 로드 오류
             */
            await expect(result).rejects.toThrow(/Parent document is in another group: child/);
        });
    });

    describe("머리말과 오류 위치", () => {
        test("[DOC-010] 문서 메타는 BOM, CRLF, 파일 끝의 닫는 구분자를 처리한다", async ({scope}) => {
            /**
             * GIVEN
             * BOM과 CRLF가 있는 문서, 닫는 구분자로 끝나는 문서
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
             * 렌더한 본문과 머리말 이름의 제목
             */
            expect(api?.html).toMatch(/예:이것/);
            expect(empty?.html).toMatch(/<h1[^>]*><span[^>]*>Empty<\/span><\/h1>/);

            for (const doc of docs) {
                expect(doc.html).not.toContain("wg_article__eyebrow");
            }
        });

        test("[DOC-011] 문서 지시문 오류는 메타를 포함한 원본 행 번호를 유지한다", async ({scope}) => {
            /**
             * GIVEN
             * 알 수 없는 지시문이 있는 문서
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
             * 메타를 포함한 원본 행 번호의 오류
             */
            await expect(result).rejects.toHaveProperty("line", 7);
        });

        test("[DOC-014] 머리말에 YAML 문법 오류가 있으면 문서 경로와 함께 거부한다", async ({scope}) => {
            /**
             * GIVEN
             * 같은 키가 두 번 있는 머리말
             */
            const site = siteConfigSchema.parse({});

            await writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nname: Again\nlabel: Guide\ngroup: Guide\n---\n\nText.\n");

            /**
             * WHEN
             * 문서 로드
             */
            const result = readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 문서 경로가 붙은 YAML 오류
             */
            await expect(result).rejects.toThrow(/Invalid frontmatter: public[\\/]guide\.md: Map keys must be unique at line 3/);
        });
    });

    describe("수집 범위", () => {
        test("[DOC-012] 문서 폴더 안의 생성물, 저장소, 설치 폴더는 문서로 수집하지 않는다", async ({scope}) => {
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
             * 예약 폴더 밖의 문서만 수집
             */
            expect(docs.map((doc) => doc.id)).toStrictEqual(["guide"]);
        });

        test("[DOC-013] 루트 에이전트 지침은 제외하고 하위 폴더의 같은 이름 문서는 수집한다", async ({scope}) => {
            /**
             * GIVEN
             * content 루트의 README, 에이전트 지침과 공개 폴더의 같은 이름 문서
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
             * 공개 폴더의 같은 이름 문서만 수집
             */
            expect(new Set(docs.map((doc) => doc.id))).toStrictEqual(new Set(["guide/agents", "guide/claude"]));
        });

        test("[DOC-015] 번역 폴더의 문서는 언어 코드 접두 id와 같은 언어의 부모로 수집한다", async ({scope}) => {
            /**
             * GIVEN
             * 기본 언어 문서 둘과 같은 파일명의 한국어 번역, 번역 안에서 일반 id로 지정한 부모와 상대 링크
             */
            const site = siteConfigSchema.parse({lang: "en", locales: {ko: {}}});
            const localeScope = {...scope, locales: [{code: "ko", root: join(scope.root, "ko"), publicRoot: join(scope.root, "ko/public")}]};

            await mkdir(join(scope.root, "ko/public"), {recursive: true});

            await Promise.all([
                writeFile(join(scope.root, "ko/README.md"), "# 홈\n"),
                writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "setup.md"), "---\nname: Setup\nlabel: Setup\ngroup: Guide\nparent: guide\n---\n\nText.\n"),
                writeFile(join(scope.root, "ko/public/guide.md"), "---\nname: Guide\nlabel: 안내\ngroup: Guide\n---\n\n[설치](setup.md)\n"),
                writeFile(
                    join(scope.root, "ko/public/setup.md"),
                    "---\nname: Setup\nlabel: 설치\ngroup: Guide\nparent: guide\n---\n\n[홈](../README.md) [English](../../public/setup.md)\n",
                ),
            ]);

            /**
             * WHEN
             * 문서 로드
             */
            const docs = await readDocs({scope: localeScope, processor: toProcessor({site, scope: localeScope})});
            const translated = docs.find((doc) => doc.id === "ko/setup");

            /**
             * THEN
             * 접두 id와 locale, 같은 언어의 부모와 조상, 번역 안의 홈과 영어 문서 링크
             */
            expect(new Set(docs.map((doc) => `${doc.id}:${doc.locale}`))).toStrictEqual(new Set(["guide:undefined", "setup:undefined", "ko/guide:ko", "ko/setup:ko"]));
            expect(translated?.data.parent).toBe("ko/guide");
            expect(translated?.ancestors).toStrictEqual(["ko/guide"]);
            expect(translated?.html).toContain('href="/ko/"');
            expect(translated?.html).toContain('href="/setup/"');
            expect(docs.find((doc) => doc.id === "ko/guide")?.html).toContain('href="/ko/setup/"');
        });

        test("[DOC-016] 기본 언어 공개 문서는 언어 코드 경로를 쓸 수 없다", async ({scope}) => {
            /**
             * GIVEN
             * 번역 언어 코드와 같은 이름의 공개 하위 폴더
             */
            const site = siteConfigSchema.parse({lang: "en", locales: {ko: {}}});
            const localeScope = {...scope, locales: [{code: "ko", root: join(scope.root, "ko"), publicRoot: join(scope.root, "ko/public")}]};

            await mkdir(join(scope.publicRoot, "ko"));
            await writeFile(join(scope.publicRoot, "ko/notes.md"), "---\nname: Notes\nlabel: Notes\ngroup: Guide\n---\n\nText.\n");

            /**
             * WHEN
             * 문서 로드
             */
            const result = readDocs({scope: localeScope, processor: toProcessor({site, scope: localeScope})});

            /**
             * THEN
             * 번역 접두사 예약 오류
             */
            await expect(result).rejects.toThrow(/The locale URL prefix is reserved for translated documents/);
        });

        test("[DOC-017] 번역 문서는 다른 언어 문서를 부모로 둘 수 없다", async ({scope}) => {
            /**
             * GIVEN
             * 영어 부모를 상대 경로로 가리키는 한국어 문서
             */
            const site = siteConfigSchema.parse({lang: "en", locales: {ko: {}}});
            const localeScope = {...scope, locales: [{code: "ko", root: join(scope.root, "ko"), publicRoot: join(scope.root, "ko/public")}]};

            await mkdir(join(scope.root, "ko/public"), {recursive: true});

            await Promise.all([
                writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
                writeFile(join(scope.root, "ko/public/setup.md"), "---\nname: Setup\nlabel: 설치\ngroup: Guide\nparent: ../../public/guide\n---\n\nText.\n"),
            ]);

            /**
             * WHEN
             * 문서 로드
             */
            const result = readDocs({scope: localeScope, processor: toProcessor({site, scope: localeScope})});

            /**
             * THEN
             * 다른 언어 부모 오류
             */
            await expect(result).rejects.toThrow(/Parent document is in another language: ko\/setup → guide/);
        });
    });

    describe("작성 날짜", () => {
        test("[DOC-018] 머리말 날짜는 제목 아래에 페이지 언어의 라벨과 함께 표시한다", async ({scope}) => {
            /**
             * GIVEN
             * 영어 기본 문서와 한국어 번역의 두 날짜, 처음 작성 날짜만 있는 문서, 날짜 없는 문서
             */
            const site = siteConfigSchema.parse({lang: "en", locales: {ko: {}}});
            const localeScope = {...scope, locales: [{code: "ko", root: join(scope.root, "ko"), publicRoot: join(scope.root, "ko/public")}]};

            await mkdir(join(scope.root, "ko/public"), {recursive: true});

            await Promise.all([
                writeFile(join(scope.publicRoot, "post.md"), "---\nname: Post\nlabel: Post\ngroup: Posts\ncreated: 2022-12\nrevised: 2026-10-05\n---\n\nLead.\n"),
                writeFile(join(scope.root, "ko/public/post.md"), "---\nname: Post\nlabel: 글\ngroup: Posts\ncreated: 2022-12\nrevised: 2026-10-05\n---\n\n소개.\n"),
                writeFile(join(scope.publicRoot, "note.md"), "---\nname: Note\nlabel: Note\ngroup: Posts\ncreated: 2026-10\n---\n\nLead.\n"),
                writeFile(join(scope.publicRoot, "plain.md"), "---\nname: Plain\nlabel: Plain\ngroup: Posts\n---\n\nLead.\n"),
            ]);

            /**
             * WHEN
             * 문서 로드
             */
            const docs = await readDocs({scope: localeScope, processor: toProcessor({site, scope: localeScope})});
            const html = Object.fromEntries(docs.map((doc) => [doc.id, doc.html]));

            /**
             * THEN
             * 제목과 소개 사이의 날짜 줄, 영어와 한국어 라벨, 적은 그대로의 time 값, 날짜가 없으면 줄 생략
             */
            expect(html.post).toContain(
                '</h1><p class="wg_article__dates">Created <time datetime="2022-12">2022-12</time>, Revised <time datetime="2026-10-05">2026-10-05</time></p><p>Lead.</p>',
            );
            expect(html["ko/post"]).toContain(
                '<p class="wg_article__dates">작성일 <time datetime="2022-12">2022-12</time>, 수정일 <time datetime="2026-10-05">2026-10-05</time></p>',
            );
            expect(html.note).toContain('<p class="wg_article__dates">Created <time datetime="2026-10">2026-10</time></p>');
            expect(html.plain).not.toContain("wg_article__dates");
        });

        test("[DOC-019] 형식이 다른 날짜는 문서 경로와 항목 이름과 함께 거부한다", async ({scope}) => {
            /**
             * GIVEN
             * 연도만 적은 처음 작성 날짜
             */
            const site = siteConfigSchema.parse({});

            await writeFile(join(scope.publicRoot, "post.md"), "---\nname: Post\nlabel: Post\ngroup: Posts\ncreated: 2022\n---\n\nText.\n");

            /**
             * WHEN
             * 문서 로드
             */
            const result = readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 문서 경로와 날짜 형식 안내가 붙은 머리말 오류
             */
            await expect(result).rejects.toThrow(/Invalid frontmatter: public[\\/]post\.md: created must be YYYY-MM or YYYY-MM-DD/);
        });
    });
    describe("본문 문법", () => {
        test("[DOC-020] 물결표 하나는 글자 그대로 두고 두 개만 취소선으로 바꾼다", async ({scope}) => {
            /**
             * GIVEN
             * 범위 표기와 취소선이 함께 있는 문서
             */
            const site = siteConfigSchema.parse({});

            await writeFile(join(scope.publicRoot, "ranges.md"), "---\nname: Ranges\nlabel: Ranges\ngroup: Guide\n---\n\n10~11개월, 월 400~600만원, ~~지난 값~~.\n");

            /**
             * WHEN
             * 문서 로드
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});

            /**
             * THEN
             * 범위는 그대로, 두 개로 감싼 글만 del
             */
            expect(docs[0]?.html).toContain("10~11개월, 월 400~600만원");
            expect(docs[0]?.html).toContain("<del>지난 값</del>");
        });
    });
});

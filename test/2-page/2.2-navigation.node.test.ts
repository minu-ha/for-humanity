import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {test} from "@test/_fixture/temp-root";
import {toNavigationHtml} from "@test/_fixture/to-navigation-html";
import {describe, expect} from "vitest";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {toProcessor} from "@/app/_function/to-processor/to-processor";
import {navigationDataSchema} from "@/component/widget/sidebar/_constant/navigation-data-schema";
import {toNavigationData} from "@/component/widget/sidebar/_function/to-navigation-data/to-navigation-data";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";
import {toScriptJson} from "@/util/json/to-script-json";

/**
 * 탐색 자료와 문서 트리(src/component/widget/sidebar/_function/to-navigation-data) 검증
 */
describe("문서 탐색", () => {
    describe("탐색 자료", () => {
        test("[NAV-021] 탐색 데이터는 본문을 제외하고 작성한 이름을 안전하게 전달한다", async ({scope}) => {
            /**
             * GIVEN
             * 스크립트 종료 태그와 줄 구분자가 섞인 사이트 이름, 본문 표식이 있는 문서
             */
            const title = "</script><script>window.injected=true</script>\u2028\u2029";
            const site = siteConfigSchema.parse({title});

            await writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\nPrivate body marker.\n");

            /**
             * WHEN
             * 탐색 자료와 script JSON 생성
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const data = toNavigationData({site, docs, current: "guide"});
            const json = toScriptJson(data);

            /**
             * THEN
             * 본문 표식 없이 이스케이프한 JSON, 원래 이름의 탐색 자료
             */
            expect(data.title).toBe(title);
            expect(data.groups[0].docs[0].active).toBe(true);
            expect(json).not.toMatch(/Private body marker|<|\u2028|\u2029/);
            expect(JSON.parse(json)).toStrictEqual(data);
            expect(navigationDataSchema.parse(JSON.parse(json))).toStrictEqual(data);
        });

        test("[NAV-022] 페이지 목차는 오른쪽 영역에 한 번만 렌더된다", async ({scope}) => {
            /**
             * GIVEN
             * 소제목이 있는 README 홈
             */
            await writeFile(join(scope.root, "README.md"), "# Home\n\n## Read here\n\n### More context\n\nText.\n");

            const site = siteConfigSchema.parse({});

            /**
             * WHEN
             * 홈 렌더
             */
            const home = await readHome({scope, processor: toProcessor({site, scope})});
            const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePaths: [asset_style_path]};
            const html = await (await toPageApp({site, store: {docs: [], home}, assets}).request("/")).text();
            const rail = html.match(/<aside\b[^>]*data-sidebar-toc=""[^>]*>([\s\S]*?)<\/aside>/)?.[1];

            /**
             * THEN
             * 오른쪽 영역의 목차 하나
             */
            expect(rail).toContain('data-sidebar-scroll="outline"');
            expect(rail).toMatch(/Read here/);
            expect([...html.matchAll(/data-sidebar-scroll="outline"/g)].length).toBe(1);
        });

        test("[NAV-027] 문서 목록 식별값은 현재 문서와 무관하고 목록이 바뀌면 달라진다", async ({scope}) => {
            /**
             * GIVEN
             * 같은 묶음의 두 문서
             */
            const site = siteConfigSchema.parse({});

            await Promise.all([
                writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Docs\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "setup.md"), "---\nname: Setup\nlabel: Setup\ngroup: Docs\n---\n\nText.\n"),
            ]);

            /**
             * WHEN
             * 현재 문서별 탐색 자료와 문서 하나를 뺀 목록의 탐색 자료 생성
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const guide = toNavigationData({site, docs, current: "guide"});
            const setup = toNavigationData({site, docs, current: "setup"});
            const shorter = toNavigationData({site, docs: docs.filter((doc) => doc.id === "guide"), current: "guide"});

            /**
             * THEN
             * 현재 문서와 무관한 같은 식별값, 목록 변경 시 다른 식별값
             */
            expect(setup.signature).toBe(guide.signature);
            expect(shorter.signature).not.toBe(guide.signature);
        });
    });

    describe("묶음과 부모 문서", () => {
        test("[NAV-023] 탐색은 설정 순서대로 모든 묶음과 현재 문서를 표시한다", async ({scope}) => {
            /**
             * GIVEN
             * 이름순과 다른 탐색 설정과 여러 묶음의 문서
             */
            const site = siteConfigSchema.parse({navigation: ["Getting started", "Guide"]});

            await Promise.all([
                writeFile(join(scope.publicRoot, "commands.md"), "---\nname: Commands\nlabel: Commands\ngroup: Getting started\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "writing.md"), "---\nname: Writing\nlabel: Writing\ngroup: Guide\norder: 1\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: Guide\norder: 2\n---\n\nText.\n"),
            ]);

            /**
             * WHEN
             * 탐색 마크업 생성
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const html = toNavigationHtml({site, docs, current: "writing"});
            const groups = [...html.matchAll(/<section\b[^>]*aria-label="([^"]+)"/g)];

            /**
             * THEN
             * 설정 순서의 묶음과 현재 문서 표시
             */
            expect(groups.map((group) => group[1])).toStrictEqual(["Getting started", "Guide"]);
            expect(html).not.toMatch(/<details\b/);
            expect(html).not.toMatch(/wg_docTree__docIcon/);
            expect(html).not.toMatch(/href="\/"/);
            expect(html).not.toMatch(/>Documents<|>Overview</);
            expect(html.indexOf('href="/writing/"')).toBeLessThan(html.indexOf('href="/parts/"'));
            expect(html).toMatch(/href="\/writing\/"[^>]*aria-current="page"/);
        });

        test("[NAV-024] 중첩 묶음은 메타 경로를 따르고 같은 이름의 형제 경로를 구분한다", async ({scope}) => {
            /**
             * GIVEN
             * 중첩 경로와 같은 이름의 형제 묶음이 있는 문서
             */
            const site = siteConfigSchema.parse({navigation: ["Guide", ["Projects", "Atlas", "Research"], ["Projects", "Atlas", "Decisions"]]});

            await Promise.all([
                writeFile(join(scope.publicRoot, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "guide-two.md"), "---\nname: More guide\nlabel: Guide\ngroup: [Guide]\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "overview.md"), "---\nname: Overview\nlabel: Overview\ngroup: [Projects, Atlas]\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: [Projects, Atlas, Research]\norder: 1\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "authoring.md"), "---\nname: Authoring\nlabel: Authoring\ngroup: [Projects, Atlas, Research]\norder: 2\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "decision.md"), "---\nname: Decision\nlabel: Decision\ngroup: [Projects, Atlas, Decisions]\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "other.md"), "---\nname: Other research\nlabel: Other research\ngroup: [Projects, Beacon, Research]\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "deep.md"), "---\nname: Deep research\nlabel: Deep research\ngroup: [Projects, Atlas, Research, Archive, Drafts]\n---\n\nText.\n"),
            ]);

            /**
             * WHEN
             * 탐색 자료와 마크업 생성
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const groups = toNavigationData({site, docs}).groups;
            const reversed = toNavigationData({site, docs: docs.toReversed()}).groups;
            const html = toNavigationHtml({site, docs, current: "authoring"});
            const unselected = toNavigationHtml({site, docs});

            /**
             * THEN
             * 메타 경로의 중첩 묶음과 경로별 형제 구분
             */
            expect(groups.map((group) => group.name)).toStrictEqual(["Guide", "Projects"]);
            expect(groups[0].docs.map((doc) => doc.id)).toStrictEqual(["guide", "guide-two"]);
            expect(groups[1].groups.map((group) => group.name)).toStrictEqual(["Atlas", "Beacon"]);
            expect(groups[1].groups[0].docs.map((doc) => doc.id)).toStrictEqual(["overview"]);
            expect(groups[1].groups[0].groups.map((group) => group.name)).toStrictEqual(["Research", "Decisions"]);
            expect(groups[1].groups[0].groups[0].docs.map((doc) => doc.id)).toStrictEqual(["parts", "authoring"]);
            expect(groups[1].groups[1].groups[0].docs.map((doc) => doc.id)).toStrictEqual(["other"]);
            expect(groups[1].groups[0].groups[0].groups[0].groups[0].name).toBe("Drafts");
            expect(reversed).toStrictEqual(groups);
            expect(html).toMatch(/href="\/authoring\/"[^>]*aria-current="page"/);
            expect(html).toMatch(/Atlas<\/span><ul\b/);
            expect(html).toMatch(/Research<\/span><ul\b/);
            expect([...html.matchAll(/href="\/authoring\/"/g)].length).toBe(1);
            expect([...html.matchAll(/>Research<\/span>/g)].length).toBe(2);
            expect(unselected).not.toMatch(/aria-current="page"/);
            expect(html.indexOf('href="/parts/"')).toBeLessThan(html.indexOf('href="/authoring/"'));
            expect(html).not.toMatch(/<details\b/);
        });

        test("[NAV-025] 부모 문서는 정렬한 자식, 독립 주소, 현재 페이지 하나를 표시한다", async ({scope}) => {
            /**
             * GIVEN
             * 부모와 여러 단계 자식이 있는 문서
             */
            const site = siteConfigSchema.parse({navigation: [["Projects", "Atlas", "Guide"]]});

            await mkdir(join(scope.publicRoot, "guide"));

            await Promise.all([
                writeFile(
                    join(scope.publicRoot, "settings.md"),
                    "---\nname: Settings\nlabel: Settings\ngroup: [Projects, Atlas, Guide]\norder: 10\n---\n\nSettings introduction.\n",
                ),
                writeFile(
                    join(scope.publicRoot, "guide/site.md"),
                    "---\nname: Site\nlabel: Site\ngroup: [Projects, Atlas, Guide]\nparent: settings\norder: 20\n---\n\nSite introduction.\n",
                ),
                writeFile(
                    join(scope.publicRoot, "themes.md"),
                    "---\nname: Themes\nlabel: Themes\ngroup: [Projects, Atlas, Guide]\nparent: settings\norder: 10\n---\n\nThemes introduction.\n",
                ),
                writeFile(join(scope.publicRoot, "details.md"), "---\nname: Details\nlabel: Details\ngroup: [Projects, Atlas, Guide]\nparent: guide/site\n---\n\nDeep child.\n"),
                writeFile(join(scope.publicRoot, "writing.md"), "---\nname: Writing\nlabel: Writing\ngroup: [Projects, Atlas, Guide]\norder: 20\n---\n\nIndependent guide.\n"),
            ]);

            /**
             * WHEN
             * 탐색 자료와 마크업 생성, 문서별 페이지 요청
             */
            const docs = await readDocs({scope, processor: toProcessor({site, scope})});
            const groups = toNavigationData({site, docs}).groups;
            const guide = groups[0].groups[0].groups[0];
            const reversed = toNavigationData({site, docs: docs.toReversed()}).groups;
            const html = toNavigationHtml({site, docs, current: "details"});
            const unselected = toNavigationHtml({site, docs});

            const app = toPageApp({
                site,
                store: {docs},
                assets: {stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
            });

            const responses = await Promise.all(docs.map((doc) => app.request(`/${doc.id}/`)));

            /**
             * THEN
             * 정렬한 자식 트리, 문서마다 링크와 페이지 하나, 현재 페이지 하나
             */
            expect(guide.docs.map((doc) => doc.id)).toStrictEqual(["settings", "writing"]);
            expect(guide.docs[0].children.map((doc) => doc.id)).toStrictEqual(["themes", "guide/site"]);
            expect(guide.docs[0].children[1].children.map((doc) => doc.id)).toStrictEqual(["details"]);
            expect(docs.find((doc) => doc.id === "details")?.ancestors).toStrictEqual(["settings", "guide/site"]);
            expect(reversed).toStrictEqual(groups);
            expect(html).toMatch(/href="\/settings\/"[^>]*>Settings<\/a><ul\b[^>]*aria-label="Settings"/);
            expect(html).toMatch(/href="\/guide\/site\/"[^>]*>Site<\/a><ul\b[^>]*aria-label="Site"/);
            expect(html).toMatch(/href="\/details\/"[^>]*aria-current="page"/);
            expect([...html.matchAll(/aria-current="page"/g)].length).toBe(1);
            expect([...html.matchAll(/wg_docList__link--active/g)].length).toBe(1);

            for (const doc of docs) {
                expect(html.split(`href="/${doc.id}/"`).length - 1).toBe(1);
            }

            expect(html.indexOf('href="/themes/"')).toBeLessThan(html.indexOf('href="/guide/site/"'));
            expect(unselected).not.toMatch(/aria-current="page"/);

            for (const response of responses) {
                expect(response.status).toBe(200);
            }
        });

        test("[NAV-026] 상대 부모 경로는 전체 문서와 하위 프로젝트 루트에서 모두 해석된다", async ({scope}) => {
            /**
             * GIVEN
             * 상대 경로로 부모를 지정한 하위 프로젝트 문서
             */
            const site = siteConfigSchema.parse({});

            await mkdir(join(scope.publicRoot, "project/research"), {recursive: true});
            await mkdir(join(scope.publicRoot, "project/guide"));

            await Promise.all([
                writeFile(join(scope.publicRoot, "project/research/README.md"), "---\nname: Research\nlabel: Research\ngroup: Guide\n---\n\nResearch introduction.\n"),
                writeFile(join(scope.publicRoot, "project/research/parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: Guide\nparent: ./readme\n---\n\nText.\n"),
                writeFile(join(scope.publicRoot, "project/guide/authoring.md"), "---\nname: Authoring\nlabel: Authoring\ngroup: Guide\nparent: ../research/readme\n---\n\nText.\n"),
            ]);

            for (const [current, parentId] of [
                [scope, "project/research/readme"],
                [{...scope, publicRoot: join(scope.publicRoot, "project")}, "research/readme"],
            ] as const) {
                /**
                 * WHEN
                 * 공개 폴더별 탐색 데이터 생성
                 */
                const docs = await readDocs({scope: current, processor: toProcessor({site, scope: current})});
                const groups = toNavigationData({site, docs}).groups;
                const children = docs.filter((doc) => doc.id !== parentId);

                /**
                 * THEN
                 * 공개 폴더 기준의 부모 id와 조상 경로
                 */
                expect(groups[0].docs.map((doc) => doc.id)).toStrictEqual([parentId]);
                expect(groups[0].docs[0].children).toHaveLength(2);
                expect(children.map((doc) => doc.data.parent)).toStrictEqual([parentId, parentId]);
                expect(children.map((doc) => doc.ancestors)).toStrictEqual([[parentId], [parentId]]);
            }
        });
    });
});

import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {toNavigationHtml} from "@test/_fixture/to-navigation-html";
import {test} from "@test/_fixture/unit";
import {describe, expect} from "vitest";
import {createProcessor} from "@/app/_function/create-processor/create-processor";
import {readDocs} from "@/app/_function/read-docs";
import {readHome} from "@/app/_function/read-home";
import {toPageApp} from "@/app/_function/to-page-app/to-page-app";
import {navigationDataSchema} from "@/component/widget/sidebar/_constant/navigation-data-schema";
import {toDocGroups} from "@/component/widget/sidebar/_function/to-doc-groups/to-doc-groups";
import {toNavigationData} from "@/component/widget/sidebar/_function/to-navigation-data/to-navigation-data";
import {toNavigationJson} from "@/component/widget/sidebar/_function/to-navigation-json";
import {asset_style_path} from "@/constant/asset";
import {siteConfigSchema} from "@/type/site-config";

describe("문서 탐색", () => {
    test("탐색 데이터는 본문을 제외하고 작성한 이름을 안전하게 전달한다", async ({root}) => {
        /**
         * GIVEN
         * 탐색 계층과 문서 입력
         */
        const title = "</script><script>window.injected=true</script>\u2028\u2029";
        const site = siteConfigSchema.parse({title});

        await writeFile(join(root, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\n## Read\n\nPrivate body marker.\n");

        /**
         * WHEN
         * 탐색 데이터와 마크업 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const data = toNavigationData({site, docs, current: "guide"});
        const json = toNavigationJson(data);

        /**
         * THEN
         * 탐색 데이터는 본문을 제외하고 작성한 이름을 안전하게 전달한 결과
         */
        expect(data.title).toBe(title);
        expect(data.groups[0].docs[0].active).toBe(true);
        expect(json).not.toMatch(/Private body marker|<|\u2028|\u2029/);
        expect(JSON.parse(json)).toStrictEqual(data);
        expect(navigationDataSchema.parse(JSON.parse(json))).toStrictEqual(data);
    });

    test("페이지 목차는 오른쪽 영역에 한 번만 렌더된다", async ({root}) => {
        /**
         * GIVEN
         * 탐색 계층과 문서 입력
         */
        await writeFile(join(root, "README.md"), "# Home\n\n## Read here\n\n### More context\n\nText.\n");

        const site = siteConfigSchema.parse({});

        /**
         * WHEN
         * 탐색 데이터와 마크업 생성
         */
        const home = await readHome({root, processor: createProcessor({site, root})});
        const assets = {fontCss: "", preload: [], browser: {kind: "inline" as const, code: ""}, stylePaths: [asset_style_path]};
        const html = await (await toPageApp({site, store: {docs: [], home}, assets}).request("/")).text();
        const rail = html.match(/<aside\b[^>]*data-sidebar-toc=""[^>]*>([\s\S]*?)<\/aside>/)?.[1];

        /**
         * THEN
         * 페이지 목차는 오른쪽 영역에 한 번만 렌더된 결과
         */
        expect(rail).toContain('data-sidebar-scroll="outline"');
        expect(rail).toMatch(/Read here/);
        expect([...html.matchAll(/data-sidebar-scroll="outline"/g)].length).toBe(1);
    });

    test("탐색은 설정 순서대로 모든 묶음과 현재 문서를 표시한다", async ({root}) => {
        /**
         * GIVEN
         * 탐색 계층과 문서 입력
         */
        const site = siteConfigSchema.parse({navigation: ["Getting started", "Guide"]});

        await Promise.all([
            writeFile(join(root, "commands.md"), "---\nname: Commands\nlabel: Commands\ngroup: Getting started\n---\n\nText.\n"),
            writeFile(join(root, "writing.md"), "---\nname: Writing\nlabel: Writing\ngroup: Guide\norder: 1\n---\n\nText.\n"),
            writeFile(join(root, "parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: Guide\norder: 2\n---\n\nText.\n"),
        ]);

        /**
         * WHEN
         * 탐색 데이터와 마크업 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const html = toNavigationHtml({site, docs, current: "writing"});
        const groups = [...html.matchAll(/<section\b[^>]*aria-label="([^"]+)"/g)];

        /**
         * THEN
         * 탐색은 설정 순서대로 모든 묶음과 현재 문서를 표시한 결과
         */
        expect(groups.map((group) => group[1])).toStrictEqual(["Getting started", "Guide"]);
        expect(html).not.toMatch(/<details\b/);
        expect(html).not.toMatch(/wg_docTree__docIcon/);
        expect(html).not.toMatch(/href="\/"/);
        expect(html).not.toMatch(/>Documents<|>Overview</);
        expect(html.indexOf('href="/writing/"')).toBeLessThan(html.indexOf('href="/parts/"'));
        expect(html).toMatch(/href="\/writing\/"[^>]*aria-current="page"/);
    });

    test("중첩 묶음은 메타 경로를 따르고 같은 이름의 형제 경로를 구분한다", async ({root}) => {
        /**
         * GIVEN
         * 탐색 계층과 문서 입력
         */
        const site = siteConfigSchema.parse({navigation: ["Guide", ["Projects", "Atlas", "Research"], ["Projects", "Atlas", "Decisions"]]});

        await Promise.all([
            writeFile(join(root, "guide.md"), "---\nname: Guide\nlabel: Guide\ngroup: Guide\n---\n\nText.\n"),
            writeFile(join(root, "guide-two.md"), "---\nname: More guide\nlabel: Guide\ngroup: [Guide]\n---\n\nText.\n"),
            writeFile(join(root, "overview.md"), "---\nname: Overview\nlabel: Overview\ngroup: [Projects, Atlas]\n---\n\nText.\n"),
            writeFile(join(root, "parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: [Projects, Atlas, Research]\norder: 1\n---\n\nText.\n"),
            writeFile(join(root, "authoring.md"), "---\nname: Authoring\nlabel: Authoring\ngroup: [Projects, Atlas, Research]\norder: 2\n---\n\nText.\n"),
            writeFile(join(root, "decision.md"), "---\nname: Decision\nlabel: Decision\ngroup: [Projects, Atlas, Decisions]\n---\n\nText.\n"),
            writeFile(join(root, "other.md"), "---\nname: Other research\nlabel: Other research\ngroup: [Projects, Beacon, Research]\n---\n\nText.\n"),
            writeFile(join(root, "deep.md"), "---\nname: Deep research\nlabel: Deep research\ngroup: [Projects, Atlas, Research, Archive, Drafts]\n---\n\nText.\n"),
        ]);

        /**
         * WHEN
         * 탐색 데이터와 마크업 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const groups = toDocGroups({docs, navigation: site.navigation});

        /**
         * THEN
         * 중첩 묶음은 메타 경로를 따르고 같은 이름의 형제 경로를 구분한 결과
         */
        expect(groups.map((group) => group.name)).toStrictEqual(["Guide", "Projects"]);
        expect(groups[0].docs.map((doc) => doc.id)).toStrictEqual(["guide", "guide-two"]);
        expect(groups[1].groups.map((group) => group.name)).toStrictEqual(["Atlas", "Beacon"]);
        expect(groups[1].groups[0].docs.map((doc) => doc.id)).toStrictEqual(["overview"]);
        expect(groups[1].groups[0].groups.map((group) => group.name)).toStrictEqual(["Research", "Decisions"]);
        expect(groups[1].groups[0].groups[0].docs.map((doc) => doc.id)).toStrictEqual(["parts", "authoring"]);
        expect(groups[1].groups[1].groups[0].docs.map((doc) => doc.id)).toStrictEqual(["other"]);
        expect(groups[1].groups[0].groups[0].groups[0].groups[0].name).toBe("Drafts");
        expect(toDocGroups({docs: docs.toReversed(), navigation: site.navigation})).toStrictEqual(groups);

        const html = toNavigationHtml({site, docs, current: "authoring"});

        expect(html).toMatch(/href="\/authoring\/"[^>]*aria-current="page"/);
        expect(html).toMatch(/Atlas<\/span><ul\b/);
        expect(html).toMatch(/Research<\/span><ul\b/);
        expect([...html.matchAll(/href="\/authoring\/"/g)].length).toBe(1);
        expect([...html.matchAll(/>Research<\/span>/g)].length).toBe(2);
        expect(toNavigationHtml({site, docs})).not.toMatch(/aria-current="page"/);
        expect(html.indexOf('href="/parts/"')).toBeLessThan(html.indexOf('href="/authoring/"'));
        expect(html).not.toMatch(/<details\b/);
    });

    test("부모 문서는 정렬한 자식과 독립 주소와 하나의 현재 페이지를 표시한다", async ({root}) => {
        /**
         * GIVEN
         * 탐색 계층과 문서 입력
         */
        const site = siteConfigSchema.parse({navigation: [["Projects", "Atlas", "Guide"]]});

        await mkdir(join(root, "guide"));

        await Promise.all([
            writeFile(join(root, "settings.md"), "---\nname: Settings\nlabel: Settings\ngroup: [Projects, Atlas, Guide]\norder: 10\n---\n\nSettings introduction.\n"),
            writeFile(join(root, "guide/site.md"), "---\nname: Site\nlabel: Site\ngroup: [Projects, Atlas, Guide]\nparent: settings\norder: 20\n---\n\nSite introduction.\n"),
            writeFile(join(root, "themes.md"), "---\nname: Themes\nlabel: Themes\ngroup: [Projects, Atlas, Guide]\nparent: settings\norder: 10\n---\n\nThemes introduction.\n"),
            writeFile(join(root, "details.md"), "---\nname: Details\nlabel: Details\ngroup: [Projects, Atlas, Guide]\nparent: guide/site\n---\n\nDeep child.\n"),
            writeFile(join(root, "writing.md"), "---\nname: Writing\nlabel: Writing\ngroup: [Projects, Atlas, Guide]\norder: 20\n---\n\nIndependent guide.\n"),
        ]);

        /**
         * WHEN
         * 탐색 데이터와 마크업 생성
         */
        const docs = await readDocs({root, processor: createProcessor({site, root})});
        const groups = toDocGroups({docs, navigation: site.navigation});
        const guide = groups[0].groups[0].groups[0];

        /**
         * THEN
         * 부모 문서는 정렬한 자식과 독립 주소와 하나의 현재 페이지를 표시한 결과
         */
        expect(guide.docs.map((doc) => doc.id)).toStrictEqual(["settings", "writing"]);
        expect(guide.docs[0].children?.map((doc) => doc.id)).toStrictEqual(["themes", "guide/site"]);
        expect(guide.docs[0].children?.[1].children?.map((doc) => doc.id)).toStrictEqual(["details"]);
        expect(docs.find((doc) => doc.id === "details")?.ancestors).toStrictEqual(["settings", "guide/site"]);
        expect(toDocGroups({docs: docs.toReversed(), navigation: site.navigation})).toStrictEqual(groups);

        const html = toNavigationHtml({site, docs, current: "details"});

        expect(html).toMatch(/href="\/settings\/"[^>]*>Settings<\/a><ul\b[^>]*aria-label="Settings"/);
        expect(html).toMatch(/href="\/guide\/site\/"[^>]*>Site<\/a><ul\b[^>]*aria-label="Site"/);
        expect(html).toMatch(/href="\/details\/"[^>]*aria-current="page"/);
        expect([...html.matchAll(/aria-current="page"/g)].length).toBe(1);
        expect([...html.matchAll(/wg_docList__link--active/g)].length).toBe(1);

        for (const doc of docs) {
            expect(html.split(`href="/${doc.id}/"`).length - 1).toBe(1);
        }

        expect(html.indexOf('href="/themes/"')).toBeLessThan(html.indexOf('href="/guide/site/"'));
        expect(toNavigationHtml({site, docs})).not.toMatch(/aria-current="page"/);

        const app = toPageApp({
            site,
            store: {docs},
            assets: {stylePaths: [asset_style_path], browser: {kind: "inline" as const, code: ""}, fontCss: "", preload: []},
        });

        for (const doc of docs) {
            expect((await app.request(`/${doc.id}/`)).status).toBe(200);
        }
    });

    test("상대 부모 경로는 전체 문서와 하위 프로젝트 루트에서 모두 해석된다", async ({root}) => {
        /**
         * GIVEN
         * 탐색 계층과 문서 입력
         */
        const site = siteConfigSchema.parse({});

        await mkdir(join(root, "project/research"), {recursive: true});
        await mkdir(join(root, "project/guide"));

        await Promise.all([
            writeFile(join(root, "project/research/README.md"), "---\nname: Research\nlabel: Research\ngroup: Guide\n---\n\nResearch introduction.\n"),
            writeFile(join(root, "project/research/parts.md"), "---\nname: Parts\nlabel: Parts\ngroup: Guide\nparent: ./readme\n---\n\nText.\n"),
            writeFile(join(root, "project/guide/authoring.md"), "---\nname: Authoring\nlabel: Authoring\ngroup: Guide\nparent: ../research/readme\n---\n\nText.\n"),
        ]);

        for (const scope of [root, join(root, "project")]) {
            /**
             * WHEN
             * 탐색 데이터와 마크업 생성
             */
            const docs = await readDocs({root: scope, processor: createProcessor({site, root: scope})});
            const parentId = scope === root ? "project/research/readme" : "research/readme";
            const groups = toDocGroups({docs, navigation: site.navigation});

            /**
             * THEN
             * 상대 부모 경로는 전체 문서와 하위 프로젝트 루트에서 모두 해석된 결과
             */
            expect(groups[0].docs.map((doc) => doc.id)).toStrictEqual([parentId]);
            expect(groups[0].docs[0].children).toHaveLength(2);
            expect(groups[0].docs[0].children?.map((doc) => doc.data.parent)).toStrictEqual([parentId, parentId]);
            expect(groups[0].docs[0].children?.map((doc) => doc.ancestors)).toStrictEqual([[parentId], [parentId]]);
        }
    });
});

import {existsSync} from "node:fs";
import {readdir, readFile} from "node:fs/promises";
import {dirname, join, relative, resolve} from "node:path";
import {isEqual} from "es-toolkit/predicate";
import {VFile} from "vfile";
import {Document, parseDocument} from "yaml";
import {
    copy_error_doc_id,
    copy_error_doc_id_clash,
    copy_error_doc_parent_cycle,
    copy_error_doc_parent_group,
    copy_error_doc_parent_locale,
    copy_error_doc_parent_missing,
    copy_error_frontmatter,
} from "@/app/_constant/copy";
import type {Processor} from "@/app/_type/processor";
import {asset_dir, asset_favicon_path, asset_not_found_path} from "@/constant/asset";
import {copy_warn_broken_anchor} from "@/constant/copy";
import {doc_data_absent} from "@/constant/doc";
import type {ContentScope} from "@/type/content-scope";
import type {Doc} from "@/type/doc";
import {docDataSchema} from "@/type/doc-data";
import type {DocFileData} from "@/type/doc-file-data";
import {toIssueText} from "@/util/error/to-issue-text";
import {assertContentPath} from "@/util/file/assert-content-path";
import {hasReservedFolder} from "@/util/file/has-reserved-folder";
import {toContentId} from "@/util/file/to-content-id";
import {logger} from "@/util/logger/logger";

/**
 * 문서 폴더를 읽고 명령별 출력 경로와 함께 검증하는 입력
 */
interface ReadDocsParams {
    /**
     * 공개, 내부, 번역 문서 폴더와 참조 범위
     */
    scope: ContentScope;

    /**
     * 설정, 자원 목록을 연결한 Markdown 처리기
     */
    processor: Processor;

    /**
     * 명령이 생성할 파일과 충돌하는 첫 경로 조각. 생략 시 추가 예약 없음
     */
    reserved?: readonly string[];
}

/**
 * 공개 범위의 Markdown 수집과 렌더링
 *
 *   - 공개 문서, 있는 번역 폴더의 문서, 개발 실행의 내부 문서만 수집
 *   - 머리말, 문서 식별자 중복, 플러그인 오류 시 실패
 */
export const readDocs = async (params: ReadDocsParams): Promise<Doc[]> => {
    const roots = [
        {dir: params.scope.publicRoot, locale: undefined},
        ...(params.scope.includePrivate && existsSync(params.scope.privateRoot) ? [{dir: params.scope.privateRoot, locale: undefined}] : []),
        ...params.scope.locales.filter((locale) => existsSync(locale.publicRoot)).map((locale) => ({dir: locale.publicRoot, locale: locale.code})),
    ];

    const entries = (
        await Promise.all(
            roots.map(async (root) => {
                return (await readdir(root.dir, {recursive: true})).map((path) => ({path: relative(params.scope.root, join(root.dir, path)), locale: root.locale}));
            }),
        )
    )
        .flat()
        .filter((entry) => /\.mdx?$/i.test(entry.path) && !hasReservedFolder(entry.path));

    const rendered = await Promise.all(
        entries.map(async (entry): Promise<{doc: Doc; path: string; anchors: DocFileData["anchors"]}> => {
            const absolutePath = join(params.scope.root, entry.path);

            assertContentPath({scope: params.scope, path: absolutePath});

            const id = toContentId({scope: params.scope, path: absolutePath});
            const segments = id.split("/");

            // Hono, SSG, 정적 제공의 공통 URL 계약. 예약 문자로 생기는 페이지 누락 방지
            if (
                segments.some((segment) => segment === "" || segment === "." || segment === ".." || segment === "index.html") ||
                /[#?%*:\\]/.test(id) ||
                /[\p{Cc}]/u.test(id) ||
                params.reserved?.includes(segments[0]) === true ||
                segments[0] === asset_dir ||
                segments[0] === asset_favicon_path.slice(1) ||
                segments[0] === asset_not_found_path.slice(1)
            ) {
                throw new Error(`${copy_error_doc_id}: ${entry.path}`);
            }

            const source = await readFile(absolutePath, "utf8");

            // 원문에서도 UTF-8 BOM 제거. remark 파서와 지시문 offset 기준 일치
            const file = new VFile({value: source.replace(/^﻿/, ""), path: absolutePath});
            const tree = params.processor.parse(file);
            const frontmatter = tree.children[0];

            // YAML 문법 오류와 경고에 문서 경로 추가. yaml 패키지의 기본 출력은 경로 미포함
            // 줄 번호의 원문 기준 보정, 여는 --- 줄 자리에 빈 줄 추가
            const yaml = frontmatter?.type === "yaml" ? parseDocument(`\n${frontmatter.value}`) : new Document(doc_data_absent);

            if (yaml.errors.length > 0) {
                throw new Error(`${copy_error_frontmatter}: ${entry.path}: ${yaml.errors[0].message}`);
            }

            for (const warning of yaml.warnings) {
                file.message(warning.message, frontmatter);
            }

            const parsed = docDataSchema.safeParse(yaml.toJS());

            if (!parsed.success) {
                throw new Error(`${copy_error_frontmatter}: ${entry.path}: ${toIssueText(parsed.error)}`);
            }

            // 일반 부모 id는 사이트 id. 번역 문서에서는 같은 언어 안의 id
            const parentId = entry.locale === undefined || parsed.data.parent === undefined ? parsed.data.parent : `${entry.locale}/${parsed.data.parent}`;

            // 상대 부모 id는 파일 위치 기준으로 한 번 해소. 문서 루트를 바꿔도 같은 관계 유지
            const data = {
                ...parsed.data,
                parent:
                    parsed.data.parent !== undefined && /^\.\.?\//.test(parsed.data.parent)
                        ? toContentId({scope: params.scope, path: resolve(dirname(file.path), parsed.data.parent)})
                        : parentId,
            };

            // 플러그인의 제목, 절 정보 공유
            const fh: DocFileData = {frontmatter: data, locale: entry.locale, headings: [], sections: [], anchors: []};

            file.data.fh = fh;

            // YAML 노드만 제외. 본문 위치와 오류의 원본 줄, 열, offset 유지
            tree.children = tree.children.filter((node) => node.type !== "yaml");

            const hast = await params.processor.run(tree, file);

            return {
                doc: {
                    id,
                    locale: entry.locale,
                    data,
                    ancestors: [],
                    html: params.processor.stringify(hast, file),
                    outline: {headings: fh.headings, sections: fh.sections},
                },
                path: entry.path,
                anchors: fh.anchors,
            };
        }),
    );

    const docs = rendered.map((entry) => entry.doc);

    const duplicateIds = [...Map.groupBy(docs, (doc) => doc.id)].filter((entry) => entry[1].length > 1);

    if (duplicateIds.length > 0) {
        throw new Error(`${copy_error_doc_id_clash}: ${duplicateIds.map((entry) => entry[0]).join(", ")}`);
    }

    // 전체 파일 수집 후 부모 참조 검증. 파일 읽기 순서와 무관한 문서 경로
    const docsById = new Map(docs.map((doc) => [doc.id, doc]));

    // 다른 문서의 제목 대조. 없는 문서는 remark-links 가 이미 경고
    for (const entry of rendered) {
        for (const anchor of entry.anchors) {
            const target = docsById.get(anchor.id);

            if (target !== undefined && !target.outline.headings.some((heading) => heading.slug === anchor.hash)) {
                logger.warn(`${anchor.line === undefined ? entry.path : `${entry.path}:${anchor.line}`} ${copy_warn_broken_anchor}: /${anchor.id}/#${anchor.hash}`);
            }
        }
    }

    return docs.map((doc) => {
        const ancestors = new Set([doc.id]);

        for (let parentId = doc.data.parent; parentId !== undefined; ) {
            const parent = docsById.get(parentId);

            if (parent === undefined) {
                throw new Error(`${copy_error_doc_parent_missing}: ${doc.id} → ${parentId}`);
            }

            if (ancestors.has(parent.id)) {
                throw new Error(`${copy_error_doc_parent_cycle}: ${[...ancestors, parent.id].join(" → ")}`);
            }

            if (parent.locale !== doc.locale) {
                throw new Error(`${copy_error_doc_parent_locale}: ${doc.id} → ${parent.id}`);
            }

            if (!isEqual(parent.data.group, doc.data.group)) {
                throw new Error(`${copy_error_doc_parent_group}: ${doc.id} → ${parent.id}`);
            }

            ancestors.add(parent.id);
            parentId = parent.data.parent;
        }

        return {...doc, ancestors: [...ancestors].slice(1).toReversed()};
    });
};

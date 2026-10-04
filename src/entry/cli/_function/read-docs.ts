import {readdir, readFile} from "node:fs/promises";
import {join, posix, sep} from "node:path";
import {VFile} from "vfile";
import {parse as parseYaml} from "yaml";
import {asset_dir, asset_favicon_path} from "@/constant/asset";
import {
    copy_error_doc_id,
    copy_error_doc_id_clash,
    copy_error_doc_parent_cycle,
    copy_error_doc_parent_group,
    copy_error_doc_parent_missing,
    copy_error_frontmatter,
} from "@/constant/copy";
import type {Processor} from "@/entry/cli/_function/create-processor/create-processor";
import type {Doc} from "@/type/doc";
import {docDataSchema} from "@/type/doc-data";
import type {DocFileData} from "@/type/doc-file-data";

/**
 * 문서 폴더를 읽고 명령별 출력 경로와 함께 검증하는 입력
 */
export interface ReadDocsParams {
    /**
     * CLI에 넘긴 문서 폴더의 절대 경로
     */
    root: string;
    /**
     * 설정·자원 목록을 연결한 Markdown 처리기
     */
    processor: Processor;
    /**
     * 명령이 생성할 파일과 충돌하는 첫 경로 조각 · 생략 시 추가 예약 없음
     */
    reserved?: readonly string[];
}

/**
 * Markdown 수집과 렌더링 · 루트 README는 홈, AGENTS·CLAUDE는 작성 지침으로 분리
 * 문서 목록에서 루트 안내 파일·node_modules·dist 제외
 * 머리말·문서 식별자 중복·플러그인 오류 시 실패
 */
export const readDocs = async (options: ReadDocsParams): Promise<Doc[]> => {
    const paths = (await readdir(options.root, {recursive: true})).filter(
        (path) => /\.mdx?$/i.test(path) && !/^(readme|agents|claude)\.md$/i.test(path) && !path.split(sep).includes("node_modules") && !path.startsWith(`dist${sep}`),
    );
    const docs = await Promise.all(
        paths.map(async (path): Promise<Doc> => {
            const id = path
                .replace(/\.mdx?$/i, "")
                .split(sep)
                .join("/")
                .toLowerCase();
            const segments = id.split("/");

            // Hono·SSG·정적 제공의 공통 URL 계약 · 예약 문자에 의한 페이지 누락 방지
            if (
                segments.some((segment) => segment === "" || segment === "." || segment === ".." || segment === "index.html") ||
                /[#?%*:\\]/.test(id) ||
                /[\p{Cc}]/u.test(id) ||
                options.reserved?.includes(segments[0]) === true ||
                segments[0] === asset_dir ||
                segments[0] === asset_favicon_path.slice(1)
            ) {
                throw new Error(`${copy_error_doc_id}: ${path}`);
            }

            const source = await readFile(join(options.root, path), "utf8");
            // remark가 제외하는 UTF-8 BOM을 원문에서도 제거 · 지시문의 offset 기준 일치
            const file = new VFile({value: source.replace(/^\uFEFF/, ""), path: join(options.root, path)});
            const tree = options.processor.parse(file);
            const frontmatter = tree.children[0];
            const parsed = docDataSchema.safeParse(frontmatter?.type === "yaml" ? parseYaml(frontmatter.value) : {});

            if (!parsed.success) {
                throw new Error(`${copy_error_frontmatter}: ${path}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join(", ")}`);
            }

            // 상대 부모 id는 파일 위치 기준으로 한 번 해소 · 문서 루트를 바꿔도 같은 관계 유지
            const data = {
                ...parsed.data,
                parent: parsed.data.parent !== undefined && /^\.\.?\//.test(parsed.data.parent) ? posix.join(posix.dirname(id), parsed.data.parent) : parsed.data.parent,
            };

            // 플러그인의 제목·절 정보 공유
            const fh: DocFileData = {frontmatter: data, headings: [], sections: []};
            file.data.fh = fh;

            // YAML 노드만 제외 · 본문 위치와 오류의 원본 줄·열·offset 유지
            tree.children = tree.children.filter((node) => node.type !== "yaml");
            const rendered = await options.processor.run(tree, file);

            return {
                id,
                data,
                ancestors: [],
                html: options.processor.stringify(rendered, file),
                outline: {headings: fh.headings, sections: fh.sections},
            };
        }),
    );
    const duplicateIds = [...Map.groupBy(docs, (doc) => doc.id)].filter((entry) => entry[1].length > 1);

    if (duplicateIds.length > 0) {
        throw new Error(`${copy_error_doc_id_clash}: ${duplicateIds.map((entry) => entry[0]).join(", ")}`);
    }

    // 모든 파일을 수집한 뒤 부모 참조 검증 · 파일 읽기 순서와 무관한 문서 경로
    const docsById = new Map(docs.map((doc) => [doc.id, doc]));
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
            if (JSON.stringify(parent.data.group) !== JSON.stringify(doc.data.group)) {
                throw new Error(`${copy_error_doc_parent_group}: ${doc.id} → ${parent.id}`);
            }
            ancestors.add(parent.id);
            parentId = parent.data.parent;
        }

        return {...doc, ancestors: [...ancestors].slice(1).toReversed()};
    });
};

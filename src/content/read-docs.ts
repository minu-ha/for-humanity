import {readdir, readFile} from "node:fs/promises";
import {join, sep} from "node:path";
import {VFile} from "vfile";
import {parse as parseYaml} from "yaml";
import {asset_dir, asset_favicon_path} from "@/constant/asset";
import {copy_error_doc_id, copy_error_doc_id_clash, copy_error_frontmatter} from "@/constant/copy";
import type {Processor} from "@/content/create-processor";
import type {Doc} from "@/type/doc";
import {docDataSchema} from "@/type/doc-data";
import type {DocFileData} from "@/type/doc-file-data";

/**
 * Markdown 수집과 렌더링 · 루트 README.md, node_modules, dist 제외
 * 머리말·문서 식별자 중복·플러그인 오류 시 실패
 */
export const readDocs = async (options: {root: string; processor: Processor}): Promise<Doc[]> => {
    const paths = (await readdir(options.root, {recursive: true})).filter(
        (path) => /\.mdx?$/i.test(path) && path.toLowerCase() !== "readme.md" && !path.split(sep).includes("node_modules") && !path.startsWith(`dist${sep}`),
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

            // 플러그인의 제목·절 정보 공유
            const fh: DocFileData = {frontmatter: parsed.data, headings: [], sections: []};
            file.data.fh = fh;

            // YAML 노드만 제외 · 본문 위치와 오류의 원본 줄·열·offset 유지
            tree.children = tree.children.filter((node) => node.type !== "yaml");
            const rendered = await options.processor.run(tree, file);

            return {
                id,
                data: parsed.data,
                html: options.processor.stringify(rendered, file),
                outline: {headings: fh.headings, sections: fh.sections},
            };
        }),
    );
    const duplicateIds = [...Map.groupBy(docs, (doc) => doc.id)].filter((entry) => entry[1].length > 1);

    if (duplicateIds.length > 0) {
        throw new Error(`${copy_error_doc_id_clash}: ${duplicateIds.map((entry) => entry[0]).join(", ")}`);
    }

    return docs;
};

import {readdir, readFile} from "node:fs/promises";
import {join, sep} from "node:path";
import {VFile} from "vfile";
import {parse as parseYaml} from "yaml";
import {asset_dir, asset_favicon_path} from "@/constant/asset";
import {
	copy_error_doc_id,
	copy_error_doc_id_clash,
	copy_error_frontmatter,
	copy_error_mark_clash,
} from "@/constant/copy";
import type {Processor} from "@/content/create-processor";
import type {Doc} from "@/type/doc";
import {docDataSchema} from "@/type/doc-data";
import type {DocFileData} from "@/type/doc-file-data";

/**
 * Markdown 수집과 렌더링 · 루트 README.md, node_modules, dist 제외
 * 머리말·문서 식별자·표지 중복·플러그인 오류 시 실패
 */
export const readDocs = async (options: {root: string; processor: Processor}): Promise<Doc[]> => {
	const paths = (await readdir(options.root, {recursive: true})).filter(
		(path) =>
			/\.mdx?$/.test(path) &&
			path !== "README.md" &&
			!path.split(sep).includes("node_modules") &&
			!path.startsWith(`dist${sep}`),
	);
	const docs = await Promise.all(
		paths.map(async (path): Promise<Doc> => {
			const id = path
				.replace(/\.mdx?$/, "")
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
			const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
			const parsed = docDataSchema.safeParse(frontmatter === null ? {} : parseYaml(frontmatter[1]));

			if (!parsed.success) {
				throw new Error(
					`${copy_error_frontmatter}: ${path}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join(", ")}`,
				);
			}

			// 플러그인의 제목·절 정보 공유
			const fh: DocFileData = {frontmatter: parsed.data, headings: [], sections: []};
			const file = new VFile({
				value: frontmatter === null ? source : source.slice(frontmatter[0].length),
				path: join(options.root, path),
				data: {fh},
			});

			await options.processor.process(file);

			return {
				id,
				data: parsed.data,
				html: String(file),
				outline: {headings: fh.headings, sections: fh.sections},
			};
		}),
	);
	const duplicateIds = [...Map.groupBy(docs, (doc) => doc.id)].filter((entry) => entry[1].length > 1);

	if (duplicateIds.length > 0) {
		throw new Error(`${copy_error_doc_id_clash}: ${duplicateIds.map((entry) => entry[0]).join(", ")}`);
	}

	const clashes = [...Map.groupBy(docs, (doc) => doc.data.name[0].toUpperCase())].filter(
		(entry) => entry[1].length > 1,
	);

	if (clashes.length > 0) {
		throw new Error(
			`${copy_error_mark_clash}: ${clashes.map((entry) => `${entry[0]} (${entry[1].map((doc) => doc.data.name).join(", ")})`).join(" / ")}`,
		);
	}

	return docs;
};

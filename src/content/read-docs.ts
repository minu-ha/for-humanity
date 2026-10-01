import {readdir, readFile} from "node:fs/promises";
import {join, sep} from "node:path";
import {VFile} from "vfile";
import {parse as parseYaml} from "yaml";
import {copy_error_frontmatter, copy_error_mark_clash} from "@/constant/copy";
import type {Processor} from "@/content/create-processor";
import type {Doc} from "@/type/doc";
import {docDataSchema} from "@/type/doc-data";
import type {DocFileData} from "@/type/doc-file-data";

/**
 * 문서 폴더의 Markdown 을 모두 읽어 그린다. 폴더 맨 위의 README.md, node_modules, dist 는 문서로 치지 않는다.
 * 머리말이 틀리거나, 두 문서 이름의 첫 글자 (사이드바 표지) 가 겹치거나, 플러그인이 멈추면 오류를 던진다
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
			const source = await readFile(join(options.root, path), "utf8");
			const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
			const parsed = docDataSchema.safeParse(frontmatter === null ? {} : parseYaml(frontmatter[1]));

			if (!parsed.success) {
				throw new Error(
					`${copy_error_frontmatter}: ${path}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join(", ")}`,
				);
			}

			// 플러그인이 이 객체의 headings 와 sections 를 채운다
			const fh: DocFileData = {frontmatter: parsed.data, headings: [], sections: []};
			const file = new VFile({
				value: frontmatter === null ? source : source.slice(frontmatter[0].length),
				path: join(options.root, path),
				data: {fh},
			});

			await options.processor.process(file);

			return {
				id: path
					.replace(/\.mdx?$/, "")
					.split(sep)
					.join("/")
					.toLowerCase(),
				data: parsed.data,
				html: String(file),
				outline: {headings: fh.headings, sections: fh.sections},
			};
		}),
	);
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

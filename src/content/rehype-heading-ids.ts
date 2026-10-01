import Slugger from "github-slugger";
import type {Root} from "hast";
import {toString as toPlainText} from "hast-util-to-string";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import type {DocHeading} from "@/type/doc-heading";

/**
 * 제목 id와 목차 수집 · 같은 제목은 -1, -2 접미사
 * 절 번호 삽입 전 실행 · id와 목차 텍스트의 번호 혼입 방지
 */
export const rehypeHeadingIds = () => (tree: Root, file: VFile) => {
	const slugger = new Slugger();
	const headings: DocHeading[] = [];

	visit(tree, "element", (node) => {
		const depth = /^h([1-6])$/.exec(node.tagName)?.[1];

		if (depth === undefined) {
			return;
		}

		const text = toPlainText(node);

		node.properties.id = typeof node.properties.id === "string" ? node.properties.id : slugger.slug(text);
		headings.push({depth: Number(depth), slug: node.properties.id, text});
	});

	if (file.data.fh) {
		file.data.fh.headings = headings;
	}
};

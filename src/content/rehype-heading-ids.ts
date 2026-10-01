import Slugger from "github-slugger";
import type {Root} from "hast";
import {toString as toPlainText} from "hast-util-to-string";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import type {DocHeading} from "@/type/doc-heading";

/**
 * 제목 id 와 목차 재료. 제목 (h1 ~ h6) 에 글로 만든 id 를 매기고 문서 순서대로 모은다.
 * 번호를 넣는 rehype-sections 보다 앞에 돌아 id 와 목차 글에 번호가 섞이지 않는다. 글이 같은 제목은 뒤에 -1, -2 가 붙는다
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

import {basename} from "node:path";
import type {Element, Root} from "hast";
import type {VFile} from "vfile";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";

/**
 * 문서 머리. 눈썹 줄 (사이트 · 묶음 · 파일), 머리말 name 으로 만든 h1, 첫 절 앞의 글을 header 하나로 묶는다.
 * Markdown 이 없는 쪽 (첫 화면) 은 wg-prose.astro 가 같은 모양을 head 프롭으로 그린다
 */
export const rehypeHead = (options: {title: string}) => (tree: Root, file: VFile) => {
	const frontmatter = file.data.astro?.frontmatter;

	if (frontmatter === undefined) {
		return;
	}

	const firstSection = tree.children.findIndex(
		(node) => node.type === "element" && node.tagName === `h${section_heading_depth.section}`,
	);
	const leadEnd = firstSection === -1 ? tree.children.length : firstSection;

	tree.children = [
		{
			type: "element",
			tagName: "header",
			properties: {className: ["wg_prose__head"]},
			children: [
				{
					type: "element",
					tagName: "div",
					properties: {className: ["wg_prose__eyebrow"]},
					children: [options.title, frontmatter.group, basename(file.path)].map(
						(text): Element => ({
							type: "element",
							tagName: "span",
							properties: {},
							children: [{type: "text", value: text}],
						}),
					),
				},
				{type: "element", tagName: "h1", properties: {}, children: [{type: "text", value: frontmatter.name}]},
				...tree.children.slice(0, leadEnd).filter((node) => node.type !== "doctype"),
			],
		},
		...tree.children.slice(leadEnd),
	];
};

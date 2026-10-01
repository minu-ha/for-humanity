import {basename} from "node:path";
import type {Element, Root} from "hast";
import type {VFile} from "vfile";
import {section_heading_depth} from "@/component/widget/prose/_constant/section";

/**
 * 사이트·묶음·파일 라벨, name 제목, 첫 절 앞 본문의 공통 머리
 * Markdown 없는 첫 화면은 WgProse의 head 계약 사용
 */
export const rehypeHead = (options: {title: string}) => (tree: Root, file: VFile) => {
	const frontmatter = file.data.fh?.frontmatter;

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

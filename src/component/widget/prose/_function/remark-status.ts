import {escape as escapeHtml, escapeRegExp} from "es-toolkit/string";
import type {Root} from "mdast";
import {findAndReplace} from "mdast-util-find-and-replace";
import type {SiteConfig} from "@/type/site-config";

/**
 * 상태 표지. 설정에 적은 문구 ("확인됨 2026-09-30", "확인되지 않았다") 를 알약으로 바꾼다.
 * 괄호로 감싼 문구는 괄호를 떼고 알약이 된다. 링크와 제목 안은 그대로 둔다
 */
export const remarkStatus = (options: {status: SiteConfig["status"]}) => {
	const phrases = options.status
		.map((item) => [escapeRegExp(item.phrase), ...(item.date ? [String.raw`(?: \d{4}-\d{2}-\d{2})?`] : [])].join(""))
		.join("|");
	const pattern = new RegExp(String.raw`\((${phrases})\)|(${phrases})`, "g");

	return (tree: Root) => {
		findAndReplace(
			tree,
			[
				pattern,
				(_match: string, inParens: string | undefined, bare: string | undefined) => {
					const text = inParens ?? bare;
					const item = options.status.find((status) => text?.startsWith(status.phrase));

					// false 를 돌려주면 찾은 글을 그대로 둔다
					if (text === undefined || item === undefined) {
						return false;
					}

					return {
						type: "html",
						value: `<span class="wg_prose__pill wg_prose__pill--${item.kind}">${escapeHtml(text)}</span>`,
					};
				},
			],
			{ignore: ["link", "linkReference", "heading"]},
		);
	};
};

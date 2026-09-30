import {escape as escapeHtml, escapeRegExp} from "es-toolkit/string";
import type {Root} from "mdast";
import {findAndReplace, type RegExpMatchObject} from "mdast-util-find-and-replace";
import type {VFile} from "vfile";
import {status_candidate_pattern, status_date_pattern} from "@/component/widget/prose/_constant/status";
import {copy_warn_unknown_status} from "@/constant/copy";
import type {SiteConfig} from "@/type/site-config";

/**
 * 상태 표지. 설정에 적은 문구 ("확인됨 2026-09-30", "확인되지 않았다") 를 알약으로 바꾼다.
 * 괄호로 감싼 문구는 괄호를 떼고 알약이 된다. 링크와 제목 안은 그대로 둔다.
 * 남은 글 가운데 괄호 안이 날짜로 끝나는 것은 문구의 오타일 수 있어 파일에 경고를 남긴다. 경고는 remark-report 가 모은다
 */
export const remarkStatus = (options: {status: SiteConfig["status"]}) => {
	const phrases = options.status
		.map((item) => [escapeRegExp(item.phrase), ...(item.date ? [`(?: ${status_date_pattern})?`] : [])].join(""))
		.join("|");
	const pattern = new RegExp(String.raw`\((${phrases})\)|(${phrases})`, "g");
	const ignore = ["link", "linkReference", "heading"];

	return (tree: Root, file: VFile) => {
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
			{ignore},
		);

		findAndReplace(
			tree,
			[
				status_candidate_pattern,
				(match: string, info: RegExpMatchObject) => {
					// 자리는 위치가 남은 가장 가까운 조상으로 든다. 앞에서 알약으로 갈린 글 노드에는 위치가 없다
					file.message(
						`${copy_warn_unknown_status}: ${match}`,
						info.stack.findLast((node) => node.position !== undefined),
					);

					return false;
				},
			],
			{ignore},
		);
	};
};

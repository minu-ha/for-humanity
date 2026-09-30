import {relative} from "node:path";
import type {Root} from "mdast";
import type {VFile} from "vfile";
import {report} from "@/toolbar/report";

/**
 * 문서 검사 수집. 앞의 플러그인이 파일에 남긴 경고 (없는 문서로 건 링크, 설정에 없는 알약 문구) 를
 * `파일:줄 경고` 꼴로 report 에 모으고 터미널에도 적는다. 처리기의 마지막 remark 플러그인이어야 한다
 */
export const remarkReport = (options: {root: string}) => (_tree: Root, file: VFile) => {
	const path = relative(options.root, file.path);
	const lines = file.messages.map(
		(message) => `${message.line === undefined ? path : `${path}:${message.line}`} ${message.reason}`,
	);

	report.set(file.path, lines);

	for (const line of lines) {
		console.warn(line);
	}
};

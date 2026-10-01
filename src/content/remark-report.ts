import {relative} from "node:path";
import type {Root} from "mdast";
import type {VFile} from "vfile";

/**
 * 경고 보고. 앞의 플러그인이 파일에 남긴 경고 (없는 문서로 건 링크, 설정에 없는 알약 문구) 를 `파일:줄 경고` 꼴로 터미널에 적는다.
 * 빌드는 멈추지 않는다. 처리기의 마지막 remark 플러그인이어야 한다
 */
export const remarkReport = (options: {root: string}) => (_tree: Root, file: VFile) => {
	const path = relative(options.root, file.path);

	for (const message of file.messages) {
		console.warn(`${message.line === undefined ? path : `${path}:${message.line}`} ${message.reason}`);
	}
};

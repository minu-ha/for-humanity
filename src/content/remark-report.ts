import {relative} from "node:path";
import type {Root} from "mdast";
import type {VFile} from "vfile";

/**
 * 파일 경고의 터미널 출력 · 파일:줄 경고 · 빌드 계속
 * 경고 수집 뒤 실행하는 마지막 remark 플러그인
 */
export const remarkReport = (options: {root: string}) => (_tree: Root, file: VFile) => {
    const path = relative(options.root, file.path);

    for (const message of file.messages) {
        console.warn(`${message.line === undefined ? path : `${path}:${message.line}`} ${message.reason}`);
    }
};

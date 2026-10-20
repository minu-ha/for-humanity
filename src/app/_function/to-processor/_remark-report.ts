import {relative} from "node:path";
import type {Root} from "mdast";
import type {VFile} from "vfile";
import {logger} from "@/util/logger/logger";

/**
 * 문서 경고 표시 기준
 */
interface ReportOptions {
    /**
     * 상대 파일 이름을 표시할 문서 루트
     */
    root: string;
}

/**
 * 파일 경고의 터미널 출력. 파일:줄 경고. 빌드 계속
 *
 *   - 경고 수집 뒤 실행하는 마지막 remark 플러그인
 */
export const remarkReport = (options: ReportOptions) => (_tree: Root, file: VFile) => {
    const path = relative(options.root, file.path);

    for (const message of file.messages) {
        logger.warn(`${message.line === undefined ? path : `${path}:${message.line}`} ${message.reason}`);
    }
};

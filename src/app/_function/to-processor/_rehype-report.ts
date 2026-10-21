import {relative} from "node:path";
import type {Root} from "hast";
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
 * 파일 경고의 파일:줄 형식 터미널 출력. 빌드 계속
 *
 *   - 원시 HTML 검사 뒤 실행하는 마지막 rehype 플러그인. remark, rehype 경고 일괄 출력
 */
export const rehypeReport = (options: ReportOptions) => (_tree: Root, file: VFile) => {
    const path = relative(options.root, file.path);

    for (const message of file.messages) {
        logger.warn(`${message.line === undefined ? path : `${path}:${message.line}`} ${message.reason}`);
    }
};

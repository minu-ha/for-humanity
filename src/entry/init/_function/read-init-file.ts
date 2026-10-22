import {promises as fileSystem} from "node:fs";
import {join} from "node:path";
import {readInitPath} from "@/entry/init/_function/read-init-path";

/**
 * 초기화 파일 조회 입력
 */
interface InitFileParams {
    /**
     * 프로젝트의 절대 경로
     */
    root: string;
    /**
     * 프로젝트 기준 파일 경로
     */
    path: string;
}

/**
 * 원본을 보존하는 파일 조회, 새 파일이면 undefined
 */
export const readInitFile = async (params: InitFileParams) => {
    const entry = await readInitPath(params);

    if (entry === undefined) {
        return undefined;
    }

    if (!entry.isFile()) {
        throw new Error(`Existing folder blocks this file: ${params.path}`);
    }

    return fileSystem.readFile(join(params.root, params.path));
};

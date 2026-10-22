import {promises as fileSystem} from "node:fs";
import {join, relative, resolve, sep} from "node:path";
import {isOutsideRoot} from "@/util/file/is-outside-root";

/**
 * 초기화 프로젝트와 검사할 경로
 */
interface InitPathParams {
    /**
     * 프로젝트의 절대 경로
     */
    root: string;
    /**
     * 프로젝트 기준 상대 경로
     */
    path: string;
}

/**
 * 프로젝트 외부와 심볼릭 링크를 거부한 경로 정보
 */
export const readInitPath = async (params: InitPathParams) => {
    const location = relative(params.root, resolve(params.root, params.path));

    if (isOutsideRoot(location)) {
        throw new Error(`Path must stay inside the project: ${params.path}`);
    }

    const parts = location === "" ? [] : location.split(sep);

    for (let index = 0; index <= parts.length; index++) {
        try {
            const path = join(params.root, ...parts.slice(0, index));
            const entry = await fileSystem.lstat(path);

            if (entry.isSymbolicLink()) {
                throw new Error(`Symbolic links are not supported during init: ${path}`);
            }

            if (index === parts.length) {
                return entry;
            }

            if (!entry.isDirectory()) {
                throw new Error(`Existing file blocks this folder: ${path}`);
            }
        } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ENOENT") {
                return undefined;
            }

            throw error;
        }
    }
};

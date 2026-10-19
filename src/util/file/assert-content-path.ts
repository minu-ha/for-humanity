import {existsSync, realpathSync} from "node:fs";
import {isAbsolute, relative, resolve, sep} from "node:path";
import type {ContentScope} from "@/type/content-scope";

/**
 * 문서 참조의 공개 범위 검증 입력
 */
interface ContentPathParams {
    /**
     * 렌더 회차의 문서 범위
     */
    scope: ContentScope;

    /**
     * 검증할 파일이나 폴더의 절대 경로
     */
    path: string;
}

/**
 * 파일 경로와 symlink 대상의 공개 범위 검사
 */
export const assertContentPath = (params: ContentPathParams) => {
    for (const path of [resolve(params.path), ...(existsSync(params.path) ? [realpathSync(params.path)] : [])]) {
        const location = relative(params.scope.root, path);
        const internal = relative(params.scope.privateRoot, path);

        if (location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location) || location.split(sep).some((part) => ["dist", ".git", "node_modules"].includes(part))) {
            throw new Error(`문서 범위 밖의 참조: ${params.path}`);
        }

        if (!params.scope.includePrivate && internal !== ".." && !internal.startsWith(`..${sep}`) && !isAbsolute(internal)) {
            throw new Error(`공개 문서에서 private 자료를 참조할 수 없습니다: ${params.path}`);
        }
    }
};

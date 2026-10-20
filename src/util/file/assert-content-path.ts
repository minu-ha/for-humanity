import {existsSync, realpathSync} from "node:fs";
import {isAbsolute, relative, resolve, sep} from "node:path";
import {copy_error_private_reference, copy_error_reference_outside} from "@/constant/copy";
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
            throw new Error(`${copy_error_reference_outside}: ${params.path}`);
        }

        if (!params.scope.includePrivate && internal !== ".." && !internal.startsWith(`..${sep}`) && !isAbsolute(internal)) {
            throw new Error(`${copy_error_private_reference}: ${params.path}`);
        }
    }
};

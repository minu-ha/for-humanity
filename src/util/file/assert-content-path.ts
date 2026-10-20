import {existsSync, realpathSync} from "node:fs";
import {relative, resolve} from "node:path";
import {copy_error_private_reference, copy_error_reference_outside} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {hasReservedFolder} from "@/util/file/has-reserved-folder";
import {isOutsideRoot} from "@/util/file/is-outside-root";

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

        if (isOutsideRoot(location) || hasReservedFolder(location)) {
            throw new Error(`${copy_error_reference_outside}: ${params.path}`);
        }

        if (!params.scope.includePrivate && !isOutsideRoot(relative(params.scope.privateRoot, path))) {
            throw new Error(`${copy_error_private_reference}: ${params.path}`);
        }
    }
};

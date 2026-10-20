import {isAbsolute, relative, sep} from "node:path";
import {copy_error_markdown_outside, copy_error_private_id} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";

/**
 * 원본 문서의 사이트 식별자 변환 입력
 */
interface ContentIdParams {
    /**
     * 공개와 내부 문서의 경로 기준
     */
    scope: ContentScope;

    /**
     * Markdown 원본의 절대 경로
     */
    path: string;
}

/**
 * 폴더 이름과 독립적인 공개 URL, 내부 문서의 private 접두사
 */
export const toContentId = (params: ContentIdParams) => {
    if (relative(params.scope.root, params.path).toLowerCase() === "readme.md") {
        return "";
    }

    for (const [root, prefix] of [
        [params.scope.publicRoot, ""],
        [params.scope.privateRoot, "private/"],
    ]) {
        const location = relative(root, params.path);

        if (location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location)) {
            continue;
        }

        const id = location
            .replace(/\.mdx?$/i, "")
            .split(sep)
            .join("/")
            .toLowerCase();

        if (prefix === "" && id.split("/")[0] === "private") {
            throw new Error(`${copy_error_private_id}: ${params.path}`);
        }

        return `${prefix}${id}`;
    }

    throw new Error(`${copy_error_markdown_outside}: ${params.path}`);
};

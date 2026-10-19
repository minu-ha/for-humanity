import {existsSync, readFileSync, realpathSync, statSync} from "node:fs";
import {dirname, extname, isAbsolute, relative, resolve, sep} from "node:path";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {snippet_language_by_extension, snippet_pattern} from "@/app/_constant/snippet";
import {toSnippetBody} from "@/app/_function/create-processor/_to-snippet-body";
import {copy_error_snippet} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {assertContentPath} from "@/util/file/assert-content-path";

/**
 * 스니펫 수집 계약
 */
export interface SnippetOptions {
    /**
     * 스니펫을 읽을 수 있는 문서 루트
     */
    root: string;

    /**
     * 사이트 빌드에서 적용할 공개 범위
     */
    scope?: ContentScope;
}

/**
 * 문서 상대 경로의 코드 스니펫 삽입
 *
 *   - 선택 region과 메타를 코드 펜스에 반영
 *   - 문서 폴더 밖 경로와 없는 파일은 빌드 실패
 */
export const remarkSnippets = (options: SnippetOptions) => (tree: Root, file: VFile) => {
    visit(tree, "paragraph", (node, index, parent) => {
        const [child] = node.children;

        if (node.children.length !== 1 || child === undefined || child.type !== "text" || parent === undefined || index === undefined) {
            return;
        }

        const match = snippet_pattern.exec(child.value.trim());

        if (match === null) {
            return;
        }

        const [, path = "", region, meta] = match;
        const target = resolve(dirname(file.path), path);

        if (options.scope !== undefined) {
            try {
                assertContentPath({scope: options.scope, path: target});
            } catch (error) {
                file.fail(error instanceof Error ? error.message : String(error), node);
            }
        }

        const location = relative(options.root, target);

        if (location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location)) {
            file.fail(`${copy_error_snippet}: 문서 폴더 밖 · ${path}`, node);
        }

        if (!existsSync(target)) {
            file.fail(`${copy_error_snippet}: 파일이 없다 · ${path}`, node);
        }

        const actual = realpathSync(target);
        const actualLocation = relative(realpathSync(options.root), actual);

        if (actualLocation === ".." || actualLocation.startsWith(`..${sep}`) || isAbsolute(actualLocation) || !statSync(actual).isFile()) {
            file.fail(`${copy_error_snippet}: 문서 폴더 밖이거나 일반 파일이 아니다 · ${path}`, node);
        }

        const body = toSnippetBody(readFileSync(actual, "utf8"), region);

        if (body === undefined) {
            file.fail(`${copy_error_snippet}: region 이 없다 · ${path}#${region}`, node);

            return;
        }

        const extension = extname(actual).toLowerCase();

        parent.children.splice(index, 1, {
            type: "code",
            lang: snippet_language_by_extension[extension] === undefined ? extension.slice(1) : snippet_language_by_extension[extension],
            meta: meta === undefined ? null : meta,
            value: body,
        });
    });
};

import {existsSync, readFileSync, realpathSync, statSync} from "node:fs";
import {dirname, extname, resolve} from "node:path";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_file_missing, copy_error_not_file, copy_error_snippet} from "@/app/_constant/copy";
import {snippet_language_by_extension, snippet_pattern, snippet_region_pattern, snippet_region_pattern_by_extension} from "@/app/_constant/snippet";
import {toSnippetBody} from "@/app/_function/to-processor/_to-snippet-body";
import type {ContentScope} from "@/type/content-scope";
import {toErrorMessage} from "@/util/error/to-error-message";
import {assertContentPath} from "@/util/file/assert-content-path";

/**
 * 코드 스니펫 삽입 입력
 */
interface SnippetOptions {
    /**
     * 스니펫 경로를 해석하고 공개 범위를 검사할 문서 범위
     */
    scope: ContentScope;
}

/**
 * 문서 상대 경로의 코드 스니펫 삽입
 *
 *   - 선택 region과 메타를 코드 펜스에 반영
 *   - region 표시는 파일 확장자의 주석 형식만 인정
 *   - 문서 폴더 밖 경로, 없는 파일, 없거나 닫히지 않은 region은 빌드 실패
 */
export const remarkSnippets = (options: SnippetOptions) => (tree: Root, file: VFile) => {
    visit(tree, "paragraph", (node, index, parent) => {
        const [child] = node.children;

        if (node.children.length !== 1 || child.type !== "text" || parent === undefined || index === undefined) {
            return;
        }

        const match = snippet_pattern.exec(child.value.trim());

        if (match === null) {
            return;
        }

        const [, path, region, meta] = match;
        const target = resolve(dirname(file.path), path);

        // 경로와 symlink 대상의 문서 범위 검사
        try {
            assertContentPath({scope: options.scope, path: target});
        } catch (error) {
            file.fail(toErrorMessage(error), node);
        }

        if (!existsSync(target)) {
            file.fail(`${copy_error_snippet}: ${path} (${copy_error_file_missing})`, node);
        }

        const actual = realpathSync(target);

        if (!statSync(actual).isFile()) {
            file.fail(`${copy_error_snippet}: ${path} (${copy_error_not_file})`, node);
        }

        const source = readFileSync(actual, "utf8");
        const extension = extname(actual).toLowerCase();

        // region 오류의 이유에 스니펫 경로와 작성 위치 추가
        try {
            parent.children.splice(index, 1, {
                type: "code",
                lang: snippet_language_by_extension.get(extension) ?? extension.slice(1),
                meta,
                value: toSnippetBody({source, region, pattern: snippet_region_pattern_by_extension.get(extension) ?? snippet_region_pattern}),
            });
        } catch (error) {
            file.fail(`${copy_error_snippet}: ${path}#${region} (${toErrorMessage(error)})`, node);
        }
    });
};

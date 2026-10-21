import {existsSync} from "node:fs";
import {dirname, resolve} from "node:path";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_url_encoding, copy_warn_broken_link} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {toErrorMessage} from "@/util/error/to-error-message";
import {assertContentPath} from "@/util/file/assert-content-path";
import {toContentId} from "@/util/file/to-content-id";
import {toDecodedPath} from "@/util/file/to-decoded-path";

/**
 * 상대 문서 링크 해석 기준
 */
interface LinkOptions {
    /**
     * 링크 대상을 해석하고 공개 범위를 검사할 문서 범위
     */
    scope: ContentScope;
}

/**
 * 상대 Markdown 링크의 사이트 URL 변환, 쿼리와 해시 원문 유지
 *
 *   - 외부, 절대 URL과 같은 페이지의 해시 링크 유지. 없는 파일은 터미널 경고
 */
export const remarkLinks = (options: LinkOptions) => (tree: Root, file: VFile) => {
    visit(tree, (node) => {
        if (node.type !== "link" && node.type !== "definition") {
            return;
        }

        // 셋째 캡처 그룹: 쿼리, 해시 접미사. 파일 확인과 경로 정규화에서 제외
        const match = /^(?![a-z][a-z\d+.-]*:|\/|#)([^#?]+)(\.mdx?)([?#].*|)$/i.exec(node.url);

        if (match === null) {
            return;
        }

        const path = toDecodedPath(`${match[1]}${match[2]}`);

        if (path === undefined) {
            file.fail(`${copy_error_url_encoding}: ${node.url}`, node);
        }

        const target = resolve(dirname(file.path), path);

        try {
            assertContentPath({scope: options.scope, path: target});

            const id = toContentId({scope: options.scope, path: target});

            if (!existsSync(target)) {
                file.message(`${copy_warn_broken_link}: ${node.url}`, node);
            }

            node.url = `${id === "" ? "/" : `/${id}/`}${match[3]}`;
        } catch (error) {
            file.fail(toErrorMessage(error), node);
        }
    });
};

import {existsSync} from "node:fs";
import {dirname, posix, relative, resolve, sep} from "node:path";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_warn_broken_link} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {assertContentPath} from "@/util/file/assert-content-path";
import {toContentId} from "@/util/file/to-content-id";

/**
 * 상대 문서 링크 해석 기준
 */
interface LinkOptions {
    /**
     * 문서 루트의 절대 경로
     */
    root: string;

    /**
     * 문서 폴더와 URL을 분리하는 사이트 공개 범위
     */
    scope?: ContentScope;
}

/**
 * 상대 Markdown 링크의 사이트 URL 변환, query와 hash 원문 유지
 *
 *   - 외부, 절대 URL과 같은 페이지 hash 유지. 없는 파일은 터미널 경고
 */
export const remarkLinks = (options: LinkOptions) => (tree: Root, file: VFile) => {
    const here = posix.dirname(relative(options.root, file.path).split(sep).join("/"));

    visit(tree, (node) => {
        if (node.type !== "link" && node.type !== "definition") {
            return;
        }

        // 셋째 capture: query, hash 접미사. 파일 확인과 경로 정규화에서 제외
        const match = /^(?![a-z]+:|\/|#)([^#?]+)(\.mdx?)([?#].*|)$/i.exec(node.url);

        if (match) {
            if (options.scope !== undefined) {
                const target = resolve(dirname(file.path), decodeURIComponent(`${match[1]}${match[2]}`));
                try {
                    assertContentPath({scope: options.scope, path: target});
                    const id = toContentId({scope: options.scope, path: target});
                    if (!existsSync(target)) {
                        file.message(`${copy_warn_broken_link}: ${node.url}`, node);
                    }
                    node.url = `${id === "" ? "/" : `/${id}/`}${match[3]}`;
                } catch (error) {
                    file.fail(error instanceof Error ? error.message : String(error), node);
                }
                return;
            }
            if (!existsSync(resolve(dirname(file.path), `${match[1]}${match[2]}`))) {
                file.message(`${copy_warn_broken_link}: ${node.url}`, node);
            }

            const target = posix.join(here, `${match[1]}${match[2]}`).toLowerCase();

            node.url = target === "readme.md" ? `/${match[3]}` : `/${target.slice(0, -match[2].length)}/${match[3]}`;
        }
    });
};

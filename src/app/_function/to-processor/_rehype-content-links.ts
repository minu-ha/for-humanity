import {existsSync} from "node:fs";
import {dirname, resolve} from "node:path";
import type {Root} from "hast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {asset_srcset_candidate_pattern} from "@/app/_constant/asset";
import {copy_error_private_url} from "@/app/_constant/copy";
import {content_private_segment} from "@/constant/content";
import {copy_error_url_encoding, copy_warn_broken_link} from "@/constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {toErrorMessage} from "@/util/error/to-error-message";
import {assertContentPath} from "@/util/file/assert-content-path";
import {toContentId} from "@/util/file/to-content-id";
import {toDecodedPath} from "@/util/file/to-decoded-path";

/**
 * 원시 HTML을 포함한 문서 참조 검사 입력
 */
interface ContentLinkOptions {
    /**
     * 원시 HTML 참조를 해석하고 공개 범위를 검사할 문서 범위
     */
    scope: ContentScope;
}

/**
 * 원시 HTML의 내부 참조 차단과 Markdown 파일 링크의 사이트 URL 변환
 *
 *   - 없는 Markdown 파일 링크는 remark-links와 같은 파일 경고
 */
export const rehypeContentLinks = (options: ContentLinkOptions) => (tree: Root, file: VFile) => {
    visit(tree, "element", (node) => {
        for (const property of ["href", "src", "poster", "data", "srcSet"]) {
            const value = node.properties[property];

            if (typeof value !== "string") {
                continue;
            }

            for (const url of property === "srcSet" ? [...value.matchAll(asset_srcset_candidate_pattern)].map((candidate) => candidate[2]) : [value]) {
                if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) {
                    continue;
                }

                const [rawPath] = url.split(/[?#]/, 1);
                const path = toDecodedPath(rawPath);

                if (path === undefined) {
                    file.fail(`${copy_error_url_encoding}: ${url}`, node);
                }

                if (path.startsWith("/")) {
                    if (!options.scope.includePrivate && new URL(path, "https://content.invalid").pathname.toLowerCase().split("/")[1] === content_private_segment) {
                        file.fail(`${copy_error_private_url}: ${url}`, node);
                    }

                    continue;
                }

                const target = resolve(dirname(file.path), path);

                try {
                    assertContentPath({scope: options.scope, path: target});

                    if (property === "href" && /\.mdx?$/i.test(path)) {
                        const id = toContentId({scope: options.scope, path: target});

                        if (!existsSync(target)) {
                            file.message(`${copy_warn_broken_link}: ${url}`, node);
                        }

                        node.properties[property] = `${id === "" ? "/" : `/${id}/`}${url.slice(rawPath.length)}`;
                    }
                } catch (error) {
                    file.fail(toErrorMessage(error), node);
                }
            }
        }
    });
};

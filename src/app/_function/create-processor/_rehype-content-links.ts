import {dirname, resolve} from "node:path";
import type {Root} from "hast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_error_private_url} from "@/app/_constant/copy";
import type {ContentScope} from "@/type/content-scope";
import {assertContentPath} from "@/util/file/assert-content-path";
import {toContentId} from "@/util/file/to-content-id";

/**
 * 원시 HTML을 포함한 문서 참조 검사 입력
 */
interface ContentLinkOptions {
    /**
     * 사이트 실행에서만 적용하는 공개 범위
     */
    scope?: ContentScope;
}

/**
 * 원시 HTML의 내부 참조 차단과 Markdown 링크의 사이트 URL 변환
 */
export const rehypeContentLinks = (options: ContentLinkOptions) => (tree: Root, file: VFile) => {
    const scope = options.scope;

    if (scope === undefined) {
        return;
    }

    visit(tree, "element", (node) => {
        for (const property of ["href", "src", "poster", "data", "srcSet"]) {
            const value = node.properties[property];

            if (typeof value !== "string") {
                continue;
            }

            for (const url of property === "srcSet" ? value.split(",").map((entry) => entry.trim().split(/\s+/)[0]) : [value]) {
                if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) {
                    continue;
                }

                const path = decodeURIComponent(url.split(/[?#]/)[0]);

                try {
                    if (path.startsWith("/")) {
                        const pathname = new URL(path, "https://content.invalid").pathname.toLowerCase();

                        if (!scope.includePrivate && (pathname === "/private" || pathname.startsWith("/private/"))) {
                            throw new Error(`${copy_error_private_url}: ${url}`);
                        }

                        continue;
                    }

                    const target = resolve(dirname(file.path), path);

                    assertContentPath({scope, path: target});

                    if (property === "href" && /\.mdx?$/i.test(path)) {
                        const id = toContentId({scope, path: target});

                        node.properties[property] = `${id === "" ? "/" : `/${id}/`}${url.slice(url.split(/[?#]/)[0].length)}`;
                    }
                } catch (error) {
                    file.fail(error instanceof Error ? error.message : String(error), node);
                }
            }
        }
    });
};

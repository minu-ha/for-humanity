import {existsSync} from "node:fs";
import {dirname, posix, relative, resolve} from "node:path";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {copy_warn_broken_link} from "@/constant/copy";

/**
 * 상대 Markdown 링크 → 사이트 URL · settings.md#시간대 → /settings/#시간대
 * 외부·절대 URL과 같은 페이지 hash 유지 · 없는 파일은 터미널 경고
 */
export const remarkLinks = (options: {root: string}) => (tree: Root, file: VFile) => {
    const here = dirname(relative(options.root, file.path));

    visit(tree, (node) => {
        if (node.type !== "link" && node.type !== "definition") {
            return;
        }

        // 셋째 capture: 선택 hash · 없으면 빈 문자열
        const match = /^(?![a-z]+:|\/|#)([^#?]+)(\.mdx?)(#.*|)$/i.exec(node.url);

        if (match) {
            if (!existsSync(resolve(dirname(file.path), `${match[1]}${match[2]}`))) {
                file.message(`${copy_warn_broken_link}: ${node.url}`, node);
            }

            const target = posix.join(here, `${match[1]}${match[2]}`).toLowerCase();

            node.url = target === "readme.md" ? `/${match[3]}` : `/${posix.join(here, match[1]).toLowerCase()}/${match[3]}`;
        }
    });
};

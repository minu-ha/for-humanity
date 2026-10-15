import {existsSync, readFileSync, realpathSync, statSync} from "node:fs";
import {dirname, extname, isAbsolute, relative, resolve, sep} from "node:path";
import type {Root} from "mdast";
import {visit} from "unist-util-visit";
import type {VFile} from "vfile";
import {snippet_language_by_extension, snippet_pattern, snippet_region_pattern} from "@/app/_constant/snippet";
import {copy_error_snippet} from "@/constant/copy";

/**
 * 스니펫 수집 계약
 */
export interface SnippetOptions {
    /**
     * 스니펫을 읽을 수 있는 문서 루트
     */
    root: string;
}

/**
 * region 이름이 있으면 그 안만, 없으면 전체 · region 표시 줄은 항상 제거 · 공통 들여쓰기 제거
 */
const toSnippetBody = (source: string, region: string | undefined): string | undefined => {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let inside = region === undefined;
    let found = region === undefined;
    const kept: string[] = [];

    for (const line of lines) {
        const marker = snippet_region_pattern.exec(line);

        if (marker !== null) {
            if (region !== undefined && marker[2] === region) {
                inside = marker[1] === undefined;
                found = true;
            }

            continue;
        }

        if (inside) {
            kept.push(line);
        }
    }

    if (!found) {
        return undefined;
    }

    while (kept.length > 0 && kept[0]?.trim() === "") {
        kept.shift();
    }

    while (kept.length > 0 && kept.at(-1)?.trim() === "") {
        kept.pop();
    }

    const indents = kept.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length);
    const indent = indents.length === 0 ? 0 : Math.min(...indents);

    return kept.map((line) => line.slice(Math.min(indent, line.length - line.trimStart().length))).join("\n");
};

/**
 * `<<< ./path.ext#region 메타` 문단 → 코드 펜스 · 파일 위치 기준 경로 · 문서 폴더 밖과 없는 파일은 빌드 실패
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
        const lang = snippet_language_by_extension[extension] === undefined ? extension.slice(1) : snippet_language_by_extension[extension];

        parent.children.splice(index, 1, {type: "code", lang, meta: meta === undefined ? null : meta, value: body});
    });
};

import {readdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import {VFile} from "vfile";
import {copy_error_home_clash} from "@/constant/copy";
import type {Processor} from "@/entry/cli/_function/create-processor/create-processor";
import type {DocContent} from "@/type/doc-content";
import type {DocFileData} from "@/type/doc-file-data";

/**
 * 문서 폴더의 README.md → 홈 · 대소문자 무시 · frontmatter 불필요
 * 파일이 없으면 생성 안내 표시, 이름만 다른 README 중복은 오류
 */
export const readHome = async (options: {root: string; processor: Processor}): Promise<DocContent | undefined> => {
    const paths = (await readdir(options.root)).filter((path) => path.toLowerCase() === "readme.md");

    if (paths.length > 1) {
        throw new Error(`${copy_error_home_clash}: ${paths.join(", ")}`);
    }

    if (paths.length === 0) {
        return undefined;
    }

    const path = join(options.root, paths[0]);
    const fh: DocFileData = {headings: [], sections: []};
    // 파서와 지시문 원문 복원의 offset 기준을 맞추기 위해 BOM 제외
    const file = new VFile({value: (await readFile(path, "utf8")).replace(/^\uFEFF/, ""), path, data: {fh}});

    await options.processor.process(file);

    return {html: String(file), outline: {headings: fh.headings, sections: fh.sections}};
};

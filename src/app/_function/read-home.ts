import {readdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import {VFile} from "vfile";
import type {Processor} from "@/app/_function/create-processor/create-processor";
import {copy_error_home_clash} from "@/constant/copy";
import type {DocContent} from "@/type/doc-content";
import type {DocFileData} from "@/type/doc-file-data";

/**
 * 홈 문서 조회 입력
 */
interface ReadHomeOptions {
    /**
     * 문서 루트의 절대 경로
     */
    root: string;

    /**
     * 홈 본문에 적용할 Markdown 처리기
     */
    processor: Processor;
}

/**
 * 문서 루트의 README 홈 변환
 *
 *   - 대소문자 무시, frontmatter 불필요
 *   - 파일 부재 시 생성 안내 표시, 이름만 다른 README 중복은 오류
 */
export const readHome = async (options: ReadHomeOptions): Promise<DocContent | undefined> => {
    const paths = (await readdir(options.root)).filter((path) => path.toLowerCase() === "readme.md");

    if (paths.length > 1) {
        throw new Error(`${copy_error_home_clash}: ${paths.join(", ")}`);
    }

    if (paths.length === 0) {
        return undefined;
    }

    const path = join(options.root, paths[0]);
    const fh: DocFileData = {headings: [], sections: []};

    // 파서와 지시문 원문의 offset 일치, UTF-8 BOM 제외
    const file = new VFile({value: (await readFile(path, "utf8")).replace(/^\uFEFF/, ""), path, data: {fh}});

    await options.processor.process(file);

    return {html: String(file), outline: {headings: fh.headings, sections: fh.sections}};
};

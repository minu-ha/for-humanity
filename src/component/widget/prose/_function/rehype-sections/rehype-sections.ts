import type {Root} from "hast";
import type {VFile} from "vfile";
import {toSectionHeadings} from "@/component/widget/prose/_function/rehype-sections/_to-section-headings";
import type {DocSection} from "@/component/widget/prose/_type/doc-section";

/**
 * h2·h3의 가름 메타데이터 수집 · 작성한 제목은 그대로 유지
 * id·목차 텍스트는 앞 단계의 rehype-heading-ids 소유
 * file.data.fh.sections는 headings의 h2·h3 순서와 일치
 */
export const rehypeSections = () => (tree: Root, file: VFile) => {
    if (file.data.fh === undefined) {
        return;
    }

    file.data.fh.sections = toSectionHeadings(tree).map(
        (heading): DocSection => ({
            part: typeof heading.properties.dataPart === "string" ? heading.properties.dataPart : undefined,
        }),
    );
};

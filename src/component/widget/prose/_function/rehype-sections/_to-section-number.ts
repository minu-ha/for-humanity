import {section_number_width, section_sub_letters} from "@/component/widget/prose/_constant/section";

/**
 * 문서 순서의 절·소제목 번호 · starts는 h2 위치
 * 첫 h2 앞의 h3은 번호 없음
 */
export const toSectionNumber = (starts: number[], index: number): string | undefined => {
    const section = starts.findLastIndex((start) => start <= index);

    if (section === -1) {
        return;
    }

    const number = String(section).padStart(section_number_width, "0");
    const sub = index - starts[section];

    return sub === 0 ? number : `${number}.${section_sub_letters[sub - 1]}`;
};

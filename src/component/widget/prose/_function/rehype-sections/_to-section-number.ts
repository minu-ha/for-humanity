import {section_number_width, section_sub_letters} from "@/component/widget/prose/_constant/section";

/**
 * 문서 순서로 index 번째 제목의 번호. starts 는 절 (h2) 이 놓인 자리들이다.
 * 절은 00 · 01, 그 밑의 소제목은 01.A · 01.B 이고, 첫 절보다 앞에 온 소제목은 번호가 없다
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

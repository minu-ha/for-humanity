import type {DocHeading} from "@/type/doc-heading";

/**
 * 목차의 소제목 한 줄
 */
export interface TocSub {
	/**
	 * 제목. slug 가 링크, text 가 글이다
	 */
	heading: DocHeading;
	/**
	 * 제목 앞과 같은 번호 (01.A)
	 */
	number?: string;
}

/**
 * 목차의 절 한 줄과 그 밑의 소제목
 */
export interface TocSection extends TocSub {
	/**
	 * 이 절에서 시작하는 가름의 이름
	 */
	part?: string;
	/**
	 * 읽는 절일 때만 펼치는 소제목
	 */
	subs: TocSub[];
}

/**
 * 가름 하나에 든 절들. 목차의 왼쪽 선이 이 묶음마다 끊긴다. 첫 묶음은 가름 이름이 없을 수 있다
 */
export interface TocGroup {
	/**
	 * 묶음 위에 쓰는 가름 이름
	 */
	part?: string;
	/**
	 * 묶음에 든 절
	 */
	sections: TocSection[];
}

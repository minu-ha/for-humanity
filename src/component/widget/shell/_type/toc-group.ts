import type {DocHeading} from "@/type/doc-heading";

/**
 * 목차 소제목 항목
 */
export interface TocSub {
    /**
     * 제목 id와 텍스트
     */
    heading: DocHeading;
    /**
     * 본문과 같은 번호 · 01.A
     */
    number?: string;
}

/**
 * 목차 절과 소제목 목록
 */
export interface TocSection extends TocSub {
    /**
     * 이 절에서 시작하는 가름 이름
     */
    part?: string;
    /**
     * 현재 절에서 펼칠 소제목
     */
    subs: TocSub[];
}

/**
 * 가름별 목차 묶음 · 첫 묶음 이름 생략 가능
 */
export interface TocGroup {
    /**
     * 묶음 위의 가름 이름
     */
    part?: string;
    /**
     * 묶음의 절 목록
     */
    sections: TocSection[];
}

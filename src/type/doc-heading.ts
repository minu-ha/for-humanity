/**
 * 제목 하나의 목차 계약 · 문서 순서
 */
export interface DocHeading {
    /**
     * 제목 깊이 · h1 = 1, h2 = 2
     */
    depth: number;
    /**
     * 제목 id · URL hash 대상
     */
    slug: string;
    /**
     * 번호 삽입 전 제목 텍스트
     */
    text: string;
}

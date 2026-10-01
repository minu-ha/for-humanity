/**
 * h2·h3의 번호와 가름 · 문서 순서
 */
export interface DocSection {
    /**
     * 절·소제목 번호 · 첫 h2 앞의 h3은 생략
     */
    number?: string;
    /**
     * 이 절에서 시작하는 가름 이름
     */
    part?: string;
}

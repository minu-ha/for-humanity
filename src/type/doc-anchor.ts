/**
 * 다른 문서의 제목을 가리키는 링크. 전체 문서 수집 뒤 대조
 */
export interface DocAnchor {
    /**
     * 대상 문서 id. 사이트 주소의 앞뒤 빗금 제외
     */
    id: string;

    /**
     * 대상 제목 id. # 제외, 디코딩한 값
     */
    hash: string;

    /**
     * 링크가 있는 원문 줄. 위치가 없으면 생략
     */
    line?: number;
}

/**
 * 요소 속성 하나의 로컬 자원 수집 규칙
 */
export interface AssetReference {
    /**
     * 내용 지문 자원으로 수집할 확장자
     */
    formats: ReadonlySet<string>;

    /**
     * 미지원 형식의 빌드 오류 이유. 생략 시 원문 유지, 실제 로컬 파일만 경고
     */
    unsupported?: string;
}

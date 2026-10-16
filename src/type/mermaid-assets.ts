/**
 * Mermaid 모듈 그래프의 자체 호스팅 자원 계약
 */
export interface MermaidAssets {
    /**
     * 내용 지문이 붙은 브라우저 ESM 진입 URL
     */
    entry: string;

    /**
     * 진입 모듈과 지연 청크의 URL, 패키지 파일 경로
     */
    files: Map<string, string>;
}

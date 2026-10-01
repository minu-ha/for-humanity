/**
 * 모든 페이지가 공유하는 HTML 머리 자원
 */
export interface SiteAssets {
    /**
     * 내장 @font-face · head의 style 내용
     */
    fontCss: string;
    /**
     * preload 대상 글꼴 URL · 현재 코드 글꼴 한 파일
     */
    preload: string[];
    /**
     * dev 전용 문서 새로고침 스크립트 포함 여부
     */
    reload: boolean;
}

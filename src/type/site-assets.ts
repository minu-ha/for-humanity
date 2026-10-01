/**
 * 모든 페이지가 공유하는 HTML 머리 자원
 */
export interface SiteAssets {
    /**
     * 내장 @font-face · head의 style 내용
     */
    fontCss: string;
    /**
     * 선요청 글꼴 URL · 본문 공통 조각과 코드 글꼴
     */
    preload: string[];
    /**
     * dev 전용 문서 새로고침 스크립트 포함 여부
     */
    reload: boolean;
}

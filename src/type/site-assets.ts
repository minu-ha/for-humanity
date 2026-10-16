/**
 * 모든 페이지가 공유하는 HTML 머리 자원
 */
export interface SiteAssets {
    /**
     * 내용 지문으로 구분한 스타일시트 URL
     */
    stylePath?: string;

    /**
     * 동기 배포 번들 또는 개발 실행기의 모듈 진입점
     */
    browser:
        | {
              /**
               * 본문 앞에서 동기 실행하는 배포 형식
               */
              kind: "inline";

              /**
               * 인라인 IIFE 내용
               */
              code: string;
          }
        | {
              /**
               * 개발 서버의 모듈 수신 형식
               */
              kind: "module";

              /**
               * 브라우저에서 요청할 진입 URL
               */
              path: string;
          };

    /**
     * 내장 @font-face. head의 style 내용
     */
    fontCss: string;

    /**
     * 선요청 글꼴 URL. 사이트 이름, 본문 공통 조각, 코드
     */
    preload: string[];
}

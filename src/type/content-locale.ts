/**
 * 번역 언어 하나의 문서 폴더
 */
export interface ContentLocale {
    /**
     * 문서 폴더 이름, URL 접두, html lang을 겸하는 언어 코드
     */
    code: string;

    /**
     * 번역 README가 있는 언어 폴더
     */
    root: string;

    /**
     * /<code>/ URL에 대응하는 번역 공개 문서 폴더
     */
    publicRoot: string;
}

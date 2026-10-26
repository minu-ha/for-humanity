import type {ContentLocale} from "@/type/content-locale";

/**
 * 문서 처리 한 회차의 절대 경로와 공개 범위
 */
export interface ContentScope {
    /**
     * 홈과 공용 자원을 포함한 문서 루트
     */
    root: string;

    /**
     * URL 루트에 대응하는 공개 문서 폴더
     */
    publicRoot: string;

    /**
     * /private/ URL에 대응하는 내부 문서 폴더
     */
    privateRoot: string;

    /**
     * 개발 실행의 내부 문서 포함 여부
     */
    includePrivate: boolean;

    /**
     * 번역 언어별 홈과 공개 문서 폴더. 설정 순서
     */
    locales: ContentLocale[];
}

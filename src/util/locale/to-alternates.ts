import type {Doc} from "@/type/doc";
import type {ResolvedSiteConfig} from "@/type/site-config";
import {toPagePath} from "@/util/url/to-page-path";

/**
 * 현재 페이지의 언어판 하나
 */
export interface PageAlternate {
    /**
     * 번역 언어 코드. 기본 언어는 생략
     */
    code?: Doc["locale"];

    /**
     * html lang과 hreflang 값
     */
    lang: ResolvedSiteConfig["lang"];

    /**
     * 같은 문서의 언어판 경로. 번역이 없으면 그 언어의 홈
     */
    path: string;

    /**
     * 번역 문서의 실제 존재 여부. 홈은 항상 참
     */
    translated: boolean;
}

/**
 * 언어판 조회 입력
 */
interface AlternatesParams {
    /**
     * 기본 언어와 번역 언어 설정
     */
    site: ResolvedSiteConfig;

    /**
     * 번역 존재 여부를 확인할 전체 문서
     */
    docs: readonly Doc[];

    /**
     * 현재 문서 id, 홈이면 생략
     */
    current?: Doc["id"];

    /**
     * 현재 페이지의 언어 코드, 기본 언어면 생략
     */
    locale?: Doc["locale"];
}

/**
 * 기본 언어부터 설정 순서의 언어판. 홈은 모든 언어의 홈, 문서는 언어 접두사를 뺀 같은 경로의 번역
 */
export const toAlternates = (params: AlternatesParams): PageAlternate[] => {
    const key = params.current === undefined || params.locale === undefined ? params.current : params.current.slice(params.locale.length + 1);
    const ids = new Set(params.docs.map((doc) => doc.id));

    return [{code: undefined, lang: params.site.lang}, ...params.site.locales.map((locale) => ({code: locale.code, lang: locale.code}))].map((language) => {
        if (key === undefined) {
            return {...language, path: toPagePath(language.code), translated: true};
        }

        const id = language.code === undefined ? key : `${language.code}/${key}`;

        return ids.has(id) ? {...language, path: toPagePath(id), translated: true} : {...language, path: toPagePath(language.code), translated: false};
    });
};

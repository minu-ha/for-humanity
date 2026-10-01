import {WgProse} from "@/component/widget/prose/wg-prose";
import {WgShell} from "@/component/widget/shell/wg-shell";
import {copy_home_missing} from "@/constant/copy";
import type {Doc} from "@/type/doc";
import type {DocContent} from "@/type/doc-content";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";

/**
 * / 첫 화면 입력 · 문서 폴더 README의 본문과 목차
 */
export interface PgHomeProps {
    /**
     * 검증된 사이트 설정
     */
    site: SiteConfig;
    /**
     * 사이드바의 전체 문서
     */
    docs: Doc[];
    /**
     * HTML 머리의 공통 자원
     */
    assets: SiteAssets;
    /**
     * README 렌더링 결과 · 파일이 없으면 작성 안내
     */
    home?: DocContent;
}

export const PgHome = (props: PgHomeProps) => {
    return (
        <WgShell site={props.site} docs={props.docs} assets={props.assets} outline={props.home?.outline}>
            {/**
             * README 원문 · 없을 때만 파일 작성 안내
             */}
            {props.home === undefined ? <WgProse head={{title: props.site.title, lead: copy_home_missing}} /> : <WgProse html={props.home.html} />}
        </WgShell>
    );
};

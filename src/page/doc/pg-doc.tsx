import {WgProse} from "@/component/widget/prose/wg-prose";
import {WgShell} from "@/component/widget/shell/wg-shell";
import type {Doc} from "@/type/doc";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";

/**
 * /:slug/ 문서 페이지 입력 · 렌더링된 HTML 사용
 */
export interface PgDocProps {
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
     * 현재 페이지의 문서
     */
    doc: Doc;
}

export const PgDoc = (props: PgDocProps) => {
    return (
        <WgShell
            site={props.site}
            docs={props.docs}
            assets={props.assets}
            title={props.doc.data.name}
            current={props.doc.id}
            outline={props.doc.outline}
        >
            <WgProse html={props.doc.html} />
        </WgShell>
    );
};

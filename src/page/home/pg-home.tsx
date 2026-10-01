import clsx from "clsx";
import {WgProse} from "@/component/widget/prose/wg-prose";
import {WgShell} from "@/component/widget/shell/wg-shell";
import {copy_overview_name} from "@/constant/copy";
import {locale_doc_group, locale_doc_name} from "@/constant/locale";
import type {Doc} from "@/type/doc";
import type {SiteAssets} from "@/type/site-assets";
import type {SiteConfig} from "@/type/site-config";
import "./pg-home.css";

/**
 * / 첫 화면 입력 · 사이트 소개와 문서 카드
 * 카드 순서: 묶음 → 영어 이름
 */
export interface PgHomeProps {
    /**
     * 검증된 사이트 설정
     */
    site: SiteConfig;
    /**
     * 첫 화면 카드의 전체 문서
     */
    docs: Doc[];
    /**
     * HTML 머리의 공통 자원
     */
    assets: SiteAssets;
}

export const PgHome = (props: PgHomeProps) => {
    const docs = props.docs.toSorted((a, b) => a.data.group.localeCompare(b.data.group, locale_doc_group) || a.data.name.localeCompare(b.data.name, locale_doc_name));

    return (
        <WgShell site={props.site} docs={props.docs} assets={props.assets}>
            {/**
             * 사이트 소개 · 문서와 동일한 머리
             */}
            <WgProse
                head={{
                    eyebrow: [props.site.title, copy_overview_name],
                    title: copy_overview_name,
                    lead: props.site.description,
                }}
            />
            {/**
             * 묶음·이름순 문서 이동 카드
             */}
            <div className={clsx("pg_home__cards")}>
                {docs.map((doc) => (
                    <a key={doc.id} className={clsx("pg_home__card")} href={`/${doc.id}/`}>
                        <span className={clsx("pg_home__cardGroup")}>{doc.data.group}</span>
                        <span className={clsx("pg_home__cardTitle")}>{doc.data.name}</span>
                        <span className={clsx("pg_home__cardLabel")}>{doc.data.label}</span>
                    </a>
                ))}
            </div>
        </WgShell>
    );
};

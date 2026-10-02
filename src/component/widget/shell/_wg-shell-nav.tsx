import clsx from "clsx";
import {copy_nav_aria_label} from "@/constant/copy";
import {toDocGroups} from "@/content/to-doc-groups";
import type {Doc} from "@/type/doc";
import type {SiteConfig} from "@/type/site-config";
import "./_wg-shell-nav.css";

/**
 * 서버 사이드바 입력 · 읽는 순서의 문서 묶음
 */
export interface WgShellNavProps {
    /**
     * 문서 묶음 순서
     */
    site: SiteConfig;
    /**
     * 전체 문서 목록
     */
    docs: Doc[];
    /**
     * 현재 문서 id · 첫 화면 생략
     */
    current?: string;
}

export const WgShellNav = (props: WgShellNavProps) => {
    const docGroups = toDocGroups({docs: props.docs, navigation: props.site.navigation});

    return (
        <nav className={clsx("wg_shellNav__root")} aria-label={copy_nav_aria_label}>
            {/**
             * 문서 이동 · 독자 목적별 묶음
             */}
            <div className={clsx("wg_shellNav__docs")}>
                {/**
                 * 묶음 이름과 독립 문서 · 제목이 링크의 접근 가능한 이름
                 */}
                {docGroups.map((group) => (
                    <section className={clsx("wg_shellNav__docGroup")} key={group.name} aria-label={group.name}>
                        <div className={clsx("wg_shellNav__group")}>{group.name}</div>
                        {/**
                         * 문서의 URL과 현재 페이지 표시
                         */}
                        <ul className={clsx("wg_shellNav__list")}>
                            {group.docs.map((doc) => (
                                <li className={clsx("wg_shellNav__item")} key={doc.id}>
                                    <a
                                        className={clsx("wg_shellNav__link", {
                                            "wg_shellNav__link--active": doc.id === props.current,
                                        })}
                                        href={`/${doc.id}/`}
                                        title={doc.data.label}
                                        aria-current={doc.id === props.current ? "page" : undefined}
                                    >
                                        {doc.data.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </nav>
    );
};

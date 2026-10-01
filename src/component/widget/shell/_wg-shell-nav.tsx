import clsx from "clsx";
import {Fragment} from "react";
import {toTocGroups} from "@/component/widget/shell/_function/to-toc-groups";
import type {DocOutline} from "@/component/widget/shell/_type/doc-outline";
import {copy_nav_aria_label, copy_nav_docs_label, copy_nav_toc_label, copy_overview_label, copy_overview_name, copy_theme_label} from "@/constant/copy";
import {theme_mode} from "@/constant/theme";
import {toDocGroups} from "@/content/to-doc-groups";
import type {Doc} from "@/type/doc";
import type {SiteConfig} from "@/type/site-config";
import "./_wg-shell-nav.css";

/**
 * 서버 사이드바 입력 · 읽는 순서의 문서 묶음과 가름별 목차
 * 브라우저 동작은 client.ts 소유 · data-* 연결
 */
export interface WgShellNavProps {
    /**
     * 사이드바 사이트 이름
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
    /**
     * 현재 문서 목차 · 첫 화면 생략
     */
    outline?: DocOutline;
}

export const WgShellNav = (props: WgShellNavProps) => {
    const docGroups = toDocGroups({docs: props.docs, navigation: props.site.navigation});
    const tocGroups = props.outline === undefined ? [] : toTocGroups(props.outline);

    return (
        <nav className={clsx("wg_shellNav__root")} aria-label={copy_nav_aria_label}>
            <a className={clsx("wg_shellNav__brand")} href="/">
                {props.site.title}
            </a>
            <div className={clsx("wg_shellNav__label")}>{copy_nav_docs_label}</div>
            {/**
             * 문서 이동 · 첫 화면과 독자 목적별 묶음 · 현재 문서의 묶음 공개
             */}
            <div className={clsx("wg_shellNav__docs")}>
                <ul className={clsx("wg_shellNav__list")}>
                    <li>
                        <a
                            className={clsx("wg_shellNav__link", {
                                "wg_shellNav__link--active": props.current === undefined,
                            })}
                            href="/"
                            title={copy_overview_label}
                            aria-current={props.current === undefined ? "page" : undefined}
                        >
                            {copy_overview_name}
                        </a>
                    </li>
                </ul>
                {/**
                 * native 묶음 탐색 · 제목은 토글, 문서 제목은 별도 페이지 이동
                 */}
                {docGroups.map((group, index) => (
                    <details
                        className={clsx("wg_shellNav__docGroup")}
                        key={group.name}
                        open={group.docs.some((doc) => doc.id === props.current) || (props.current === undefined && index === 0)}
                    >
                        {/**
                         * 키보드로 접고 펼치는 묶음 이름
                         */}
                        <summary className={clsx("wg_shellNav__docSummary")}>
                            {group.name}
                            <svg
                                className={clsx("wg_shellNav__docChevron")}
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M6 3L11 8L6 13" />
                            </svg>
                        </summary>
                        {/**
                         * 문서의 URL·현재 페이지 표시는 첫 글자와 무관하게 유지
                         */}
                        <ul className={clsx("wg_shellNav__list")}>
                            {group.docs.map((doc) => (
                                <li key={doc.id}>
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
                    </details>
                ))}
            </div>
            {/**
             * 가름별 목차 · 현재 절 소제목은 client.ts에서 펼침
             */}
            {tocGroups.length > 0 && (
                <Fragment>
                    <div className={clsx("wg_shellNav__label")}>{copy_nav_toc_label}</div>
                    {tocGroups.map((group) => (
                        <Fragment key={group.sections[0].heading.slug}>
                            {group.part !== undefined && <div className={clsx("wg_shellNav__group")}>{group.part}</div>}
                            <ul className={clsx("wg_shellNav__list")}>
                                {group.sections.map((section) => (
                                    <li key={section.heading.slug}>
                                        <a className={clsx("wg_shellNav__link")} href={`#${section.heading.slug}`} data-toc-link="">
                                            <span className={clsx("wg_shellNav__mark")}>{section.number}</span>
                                            {section.heading.text}
                                        </a>
                                        {section.subs.length > 0 && (
                                            <ul className={clsx("wg_shellNav__sub")} data-toc-sub="">
                                                {section.subs.map((sub) => (
                                                    <li key={sub.heading.slug}>
                                                        <a className={clsx("wg_shellNav__subLink")} href={`#${sub.heading.slug}`} data-toc-sub-link="">
                                                            <span className={clsx("wg_shellNav__mark")}>{sub.number}</span>
                                                            {sub.heading.text}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </Fragment>
                    ))}
                </Fragment>
            )}
            <button className={clsx("wg_shellNav__theme")} type="button" aria-label={copy_theme_label.system} title={copy_theme_label.system} data-theme-toggle="">
                <svg
                    className={clsx("wg_shellNav__themeIcon")}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                >
                    <g className={clsx("wg_shellNav__themeSymbol", "wg_shellNav__themeSymbol--active")} data-theme-icon={theme_mode.system}>
                        <rect x="3" y="4" width="18" height="12" rx="1" />
                        <path d="M12 16V20M8 20H16" />
                    </g>
                    <g className={clsx("wg_shellNav__themeSymbol")} data-theme-icon={theme_mode.light}>
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2V4M12 20V22M2 12H4M20 12H22M5 5L6.5 6.5M17.5 17.5L19 19M5 19L6.5 17.5M17.5 6.5L19 5" />
                    </g>
                    <g className={clsx("wg_shellNav__themeSymbol")} data-theme-icon={theme_mode.dark}>
                        <path d="M21 12.8A9 9 0 1 1 11.2 3A7 7 0 0 0 21 12.8Z" />
                    </g>
                </svg>
            </button>
        </nav>
    );
};

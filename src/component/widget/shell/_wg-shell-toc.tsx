import clsx from "clsx";
import {Fragment} from "react";
import type {TocGroup} from "@/component/widget/shell/_type/toc-group";
import {copy_nav_toc_label} from "@/constant/copy";
import "./_wg-shell-toc.css";

/**
 * 현재 문서의 독립 목차 · client.ts에서 읽는 위치 표시
 */
export interface WgShellTocProps {
    /**
     * 본문 순서의 가름·절·소제목 · 전체 펼침
     */
    groups: TocGroup[];
}

export const WgShellToc = (props: WgShellTocProps) => {
    return (
        <nav className={clsx("wg_shellToc__root")} aria-label={copy_nav_toc_label}>
            <div className={clsx("wg_shellToc__label")}>{copy_nav_toc_label}</div>
            {/**
             * 가름별 제목 이동 · 절과 소제목의 번호는 본문과 동일
             */}
            {props.groups.map((group) => (
                <Fragment key={group.sections[0].heading.slug}>
                    {group.part !== undefined && <div className={clsx("wg_shellToc__group")}>{group.part}</div>}
                    {/**
                     * 현재 위치와 무관하게 모든 소제목 표시
                     */}
                    <ul className={clsx("wg_shellToc__list")}>
                        {group.sections.map((section) => (
                            <li key={section.heading.slug}>
                                <a className={clsx("wg_shellToc__link")} href={`#${section.heading.slug}`} data-toc-link="">
                                    <span className={clsx("wg_shellToc__mark")}>{section.number}</span>
                                    {section.heading.text}
                                </a>
                                {/**
                                 * 소제목의 들여쓰기 · JavaScript 없이도 제목 이동 가능
                                 */}
                                {section.subs.length > 0 && (
                                    <ul className={clsx("wg_shellToc__sub")}>
                                        {section.subs.map((sub) => (
                                            <li key={sub.heading.slug}>
                                                <a className={clsx("wg_shellToc__subLink")} href={`#${sub.heading.slug}`} data-toc-sub-link="">
                                                    <span className={clsx("wg_shellToc__mark")}>{sub.number}</span>
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
        </nav>
    );
};

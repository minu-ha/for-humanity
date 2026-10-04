import clsx from "clsx";
import {toNavigationBranchId} from "@/component/widget/shell/_function/to-navigation-branch-id";
import type {TocGroup} from "@/component/widget/shell/_type/toc-group";
import {WgShellBranchToggle} from "@/component/widget/shell/_wg-shell-branch-toggle";
import {copy_nav_toc_label} from "@/constant/copy";
import "./_wg-shell-toc.css";

/**
 * 문서 탐색 아래의 현재 문서 목차 · client.ts에서 읽는 위치 표시
 */
export interface WgShellTocProps {
    /**
     * 본문 순서의 가름·절·소제목 · 전체 펼침
     */
    groups: TocGroup[];
    /**
     * 같은 slug라도 페이지별로 접힘 선택을 분리하는 문서 ID
     */
    pageId: string;
}

export const WgShellToc = (props: WgShellTocProps) => {
    return (
        <nav className={clsx("wg_shellToc__root")} aria-label={copy_nav_toc_label}>
            <div className={clsx("wg_shellToc__label")}>{copy_nav_toc_label}</div>
            {/**
             * 가름별 제목 이동 · 작성한 제목을 본문과 동일하게 표시
             */}
            {props.groups.map((group) => (
                <div className={clsx("wg_shellToc__groupSection", {"wg_shellToc__groupSection--named": group.part !== undefined})} key={group.sections[0].heading.slug}>
                    {group.part !== undefined && <div className={clsx("wg_shellToc__group")}>{group.part}</div>}
                    {group.part !== undefined && <WgShellBranchToggle branchKey={`outline:${props.pageId}:part:${group.sections[0].heading.slug}`} label={group.part} />}
                    {/**
                     * 현재 위치와 무관하게 모든 소제목 표시
                     */}
                    <ul className={clsx("wg_shellToc__list")} id={toNavigationBranchId(`outline:${props.pageId}:part:${group.sections[0].heading.slug}`)}>
                        {group.sections.map((section) => (
                            <li className={clsx("wg_shellToc__item")} key={section.heading.slug}>
                                <a className={clsx("wg_shellToc__link")} href={`#${section.heading.slug}`} data-toc-link="">
                                    {section.heading.text}
                                </a>
                                {section.subs.length > 0 && (
                                    <WgShellBranchToggle branchKey={`outline:${props.pageId}:heading:${section.heading.slug}`} label={section.heading.text} />
                                )}
                                {/**
                                 * 소제목의 들여쓰기 · JavaScript 없이도 제목 이동 가능
                                 */}
                                {section.subs.length > 0 && (
                                    <ul className={clsx("wg_shellToc__sub")} id={toNavigationBranchId(`outline:${props.pageId}:heading:${section.heading.slug}`)}>
                                        {section.subs.map((sub) => (
                                            <li className={clsx("wg_shellToc__subItem")} key={sub.heading.slug}>
                                                <a className={clsx("wg_shellToc__subLink")} href={`#${sub.heading.slug}`} data-toc-sub-link="">
                                                    {sub.heading.text}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
};

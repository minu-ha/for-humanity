import clsx from "clsx";
import {useEffect, useState} from "hono/jsx";
import {reading_line_slack_px} from "@/component/widget/navigation/_constant/reading-line";
import {toNavigationBranchId} from "@/component/widget/navigation/_function/to-navigation-branch-id";
import type {TocGroup} from "@/component/widget/navigation/_type/toc-group";
import {WgNavigationBranchToggle} from "@/component/widget/navigation/_wg-navigation-branch-toggle";
import {copy_nav_toc_label} from "@/constant/copy";
import {findHashTarget} from "@/util/dom/find-hash-target";
import "./_wg-navigation-toc.css";

/**
 * 현재 문서의 목차 · 읽는 제목 한 항목과 조상 트리선 구분
 */
export interface WgNavigationTocProps {
    /**
     * 본문 순서의 가름·절·소제목
     */
    groups: TocGroup[];
    /**
     * 문서별 접힘 상태의 키
     */
    pageId: string;
    /**
     * 사용자가 접은 가지
     */
    collapsed: Record<string, boolean>;
    /**
     * 브라우저에서만 제공하는 가지 변경 동작
     */
    onToggle?: (key: string) => void;
}

export const WgNavigationToc = (props: WgNavigationTocProps) => {
    const [currentSlug, setCurrentSlug] = useState<string>();

    /**
     * 본문이 파싱된 뒤 읽는 위치를 추적 · 목차 요소와 직접 DOM 갱신은 하지 않음
     */
    useEffect(() => {
        const sections = props.groups.flatMap((group) => group.sections);
        const headings = sections.flatMap((section) => [section.heading, ...section.subs.map((sub) => sub.heading)]);
        const frame = {id: 0};

        /**
         * 접힌 본문 제목은 제외하고 읽는 선을 통과한 마지막 제목 선택
         */
        const updateCurrentHeading = () => {
            frame.id = 0;
            const visible = headings.flatMap((heading) => {
                const target = findHashTarget(`#${heading.slug}`);
                return target?.checkVisibility()
                    ? [{slug: heading.slug, top: target.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(target).scrollMarginTop)}]
                    : [];
            });
            setCurrentSlug(visible.findLast((heading) => heading.top <= reading_line_slack_px)?.slug ?? visible[0]?.slug);
        };

        /**
         * 연속 스크롤은 프레임당 한 번만 읽음
         */
        const handleReadingPositionChange = () => {
            if (frame.id === 0) frame.id = requestAnimationFrame(updateCurrentHeading);
        };

        addEventListener("scroll", handleReadingPositionChange, {passive: true});
        addEventListener("resize", handleReadingPositionChange);
        addEventListener("toggle", handleReadingPositionChange, true);
        addEventListener("pageshow", handleReadingPositionChange);
        document.addEventListener("DOMContentLoaded", handleReadingPositionChange);
        if (document.readyState !== "loading") updateCurrentHeading();

        return () => {
            cancelAnimationFrame(frame.id);
            removeEventListener("scroll", handleReadingPositionChange);
            removeEventListener("resize", handleReadingPositionChange);
            removeEventListener("toggle", handleReadingPositionChange, true);
            removeEventListener("pageshow", handleReadingPositionChange);
            document.removeEventListener("DOMContentLoaded", handleReadingPositionChange);
        };
    }, [props.groups]);

    return (
        <nav className={clsx("wg_navigationToc__root")} aria-label={copy_nav_toc_label}>
            <div className={clsx("wg_navigationToc__label")}>{copy_nav_toc_label}</div>
            {/**
             * 가름별 제목 이동 · 하위 제목이 현재 위치여도 부모 글씨는 강조하지 않음
             */}
            {props.groups.map((group) => {
                const currentIndex = group.sections.findIndex((section) => section.heading.slug === currentSlug || section.subs.some((sub) => sub.heading.slug === currentSlug));
                const partKey = `outline:${props.pageId}:part:${group.sections[0].heading.slug}`;
                return (
                    <div
                        className={clsx("wg_navigationToc__groupSection", {"wg_navigationToc__groupSection--named": group.part !== undefined})}
                        key={group.sections[0].heading.slug}
                    >
                        {group.part !== undefined && <div className={clsx("wg_navigationToc__group")}>{group.part}</div>}
                        {group.part !== undefined && <WgNavigationBranchToggle branchKey={partKey} label={group.part} collapsed={props.collapsed} onToggle={props.onToggle} />}
                        <ul className={clsx("wg_navigationToc__list")} id={toNavigationBranchId(partKey)} hidden={props.collapsed[partKey] === true}>
                            {group.sections.map((section, index) => {
                                const currentSubIndex = section.subs.findIndex((sub) => sub.heading.slug === currentSlug);
                                const sectionKey = `outline:${props.pageId}:heading:${section.heading.slug}`;
                                return (
                                    <li
                                        className={clsx("wg_navigationToc__item", {
                                            "wg_navigationToc__item--trail": index < currentIndex,
                                            "wg_navigationToc__item--current": index === currentIndex,
                                        })}
                                        key={section.heading.slug}
                                    >
                                        <a
                                            className={clsx("wg_navigationToc__link", {"wg_navigationToc__link--active": section.heading.slug === currentSlug})}
                                            href={`#${section.heading.slug}`}
                                            data-toc-link=""
                                            aria-current={section.heading.slug === currentSlug ? "location" : undefined}
                                        >
                                            {section.heading.text}
                                        </a>
                                        {section.subs.length > 0 && (
                                            <WgNavigationBranchToggle branchKey={sectionKey} label={section.heading.text} collapsed={props.collapsed} onToggle={props.onToggle} />
                                        )}
                                        {/**
                                         * 조상과 이전 형제의 트리선은 연결 · 활성 링크는 한 제목만
                                         */}
                                        {section.subs.length > 0 && (
                                            <ul className={clsx("wg_navigationToc__sub")} id={toNavigationBranchId(sectionKey)} hidden={props.collapsed[sectionKey] === true}>
                                                {section.subs.map((sub, subIndex) => (
                                                    <li
                                                        className={clsx("wg_navigationToc__subItem", {
                                                            "wg_navigationToc__subItem--trail": subIndex < currentSubIndex,
                                                            "wg_navigationToc__subItem--current": subIndex === currentSubIndex,
                                                        })}
                                                        key={sub.heading.slug}
                                                    >
                                                        <a
                                                            className={clsx("wg_navigationToc__subLink", {"wg_navigationToc__subLink--active": sub.heading.slug === currentSlug})}
                                                            href={`#${sub.heading.slug}`}
                                                            data-toc-sub-link=""
                                                            aria-current={sub.heading.slug === currentSlug ? "location" : undefined}
                                                        >
                                                            {sub.heading.text}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </nav>
    );
};

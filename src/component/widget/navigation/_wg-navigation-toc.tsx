import clsx from "clsx";
import {useLayoutEffect, useState} from "hono/jsx";
import {reading_line_slack_px} from "@/component/widget/navigation/_constant/reading-line";
import type {TocGroup} from "@/component/widget/navigation/_type/toc-group";
import {copy_nav_toc_label} from "@/constant/copy";
import {scroll_user_input_events} from "@/constant/scroll";
import {findHashLink} from "@/util/dom/find-hash-link";
import {findHashTarget} from "@/util/dom/find-hash-target";
import {isRestoringNavigation} from "@/util/dom/is-restoring-navigation";
import {toHashId} from "@/util/dom/to-hash-id";
import "./_wg-navigation-toc.css";

/**
 * 현재 문서의 목차. 읽는 제목 한 항목만 강조
 */
export interface WgNavigationTocProps {
    /**
     * 본문 순서의 가름, 절, 소제목
     */
    groups: TocGroup[];
}

export const WgNavigationToc = (props: WgNavigationTocProps) => {
    const [currentSlug, setCurrentSlug] = useState<string>();

    /**
     * 연결마다 구독 설치, 초기 위치 갱신은 본문 파싱 이후 실행
     */
    useLayoutEffect(() => {
        const sections = props.groups.flatMap((group) => group.sections);
        const headings = sections.flatMap((section) => [section.heading, ...section.subs.map((sub) => sub.heading)]);
        const frame = {id: 0};
        const lifetime = new AbortController();

        // 새로고침, 뒤로가기의 복원 위치에는 hash 제목 고정 미적용
        const lock = {slug: isRestoringNavigation() ? undefined : toHashId(location.hash)};

        /**
         * 접힌 본문 제목은 제외하고 읽는 선을 통과한 마지막 제목 선택
         *
         *   - 링크, hash로 이동한 제목은 사용자 스크롤 전까지 유지
         *   - 읽는 선에 닿지 못하는 끝 절이 있으면 마지막 한 화면 구간의 도착 위치를 문서 끝까지 비례 압축
         */
        const updateCurrentHeading = () => {
            frame.id = 0;
            const visible = headings.flatMap((heading) => {
                const target = findHashTarget(`#${heading.slug}`);
                return target?.checkVisibility()
                    ? [{slug: heading.slug, arrival: scrollY + target.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(target).scrollMarginTop)}]
                    : [];
            });
            const last = visible.at(-1);
            if (last === undefined) {
                setCurrentSlug(undefined);
                return;
            }
            const scrollEnd = document.documentElement.scrollHeight - innerHeight;
            const stretchFrom = Math.max(0, scrollEnd - innerHeight);

            // 끝 절이 없거나 스크롤할 수 없는 문서는 원래 도착 위치 사용
            const stretchScale = scrollEnd > 0 && last.arrival > scrollEnd ? (scrollEnd - stretchFrom) / (last.arrival - stretchFrom) : 1;
            const passed = visible.findLast((heading) => {
                const arrival = heading.arrival > stretchFrom ? stretchFrom + (heading.arrival - stretchFrom) * stretchScale : heading.arrival;
                return arrival <= scrollY + reading_line_slack_px;
            });
            setCurrentSlug(visible.find((heading) => heading.slug === lock.slug)?.slug ?? passed?.slug ?? visible[0].slug);
        };

        /**
         * 연속 스크롤의 프레임당 1회 위치 조회
         */
        const handleReadingPositionChange = () => {
            if (frame.id === 0) frame.id = requestAnimationFrame(updateCurrentHeading);
        };

        /**
         * 같은 문서 hash 링크의 도착 제목 고정. 같은 hash 재클릭 포함
         */
        const handleHashLinkClick = (event: MouseEvent) => {
            const link = findHashLink(event);
            if (link === null) return;
            lock.slug = toHashId(link.hash);
            handleReadingPositionChange();
        };

        /**
         * 뒤로가기, 주소 수정의 hash 변경 도착 제목 고정
         */
        const handleHashChange = () => {
            lock.slug = toHashId(location.hash);
            handleReadingPositionChange();
        };

        /**
         * 사용자 스크롤 시작. 도착 제목 고정 해제
         */
        const handleUserScroll = () => {
            lock.slug = undefined;
            handleReadingPositionChange();
        };

        addEventListener("scroll", handleReadingPositionChange, {passive: true, signal: lifetime.signal});
        addEventListener("resize", handleReadingPositionChange, {signal: lifetime.signal});
        addEventListener("toggle", handleReadingPositionChange, {capture: true, signal: lifetime.signal});
        addEventListener("pageshow", handleReadingPositionChange, {signal: lifetime.signal});
        addEventListener("hashchange", handleHashChange, {signal: lifetime.signal});
        document.addEventListener("DOMContentLoaded", handleReadingPositionChange, {signal: lifetime.signal});
        document.addEventListener("click", handleHashLinkClick, {signal: lifetime.signal});
        for (const type of scroll_user_input_events) {
            addEventListener(type, handleUserScroll, {passive: true, signal: lifetime.signal});
        }
        if (document.readyState !== "loading") updateCurrentHeading();

        return () => {
            cancelAnimationFrame(frame.id);
            lifetime.abort();
        };
    }, [props.groups]);

    return (
        <nav className={clsx("wg_navigationToc__root")} aria-label={copy_nav_toc_label}>
            <div className={clsx("wg_navigationToc__label")}>{copy_nav_toc_label}</div>
            {/**
             * 가름별 제목 이동. 하위 제목이 현재 위치여도 부모 글씨는 강조하지 않음
             */}
            {props.groups.map((group) => {
                return (
                    <div
                        className={clsx("wg_navigationToc__groupSection", {"wg_navigationToc__groupSection--named": group.part !== undefined})}
                        key={group.sections[0].heading.slug}
                    >
                        {group.part !== undefined && <div className={clsx("wg_navigationToc__group")}>{group.part}</div>}
                        <ul className={clsx("wg_navigationToc__list")}>
                            {group.sections.map((section) => {
                                return (
                                    <li className={clsx("wg_navigationToc__item")} key={section.heading.slug}>
                                        <a
                                            className={clsx("wg_navigationToc__link", {"wg_navigationToc__link--active": section.heading.slug === currentSlug})}
                                            href={`#${section.heading.slug}`}
                                            data-toc-link=""
                                            aria-current={section.heading.slug === currentSlug ? "location" : undefined}
                                        >
                                            {section.heading.text}
                                        </a>

                                        {/**
                                         * 하위 제목. 활성 링크는 한 제목만
                                         */}
                                        {section.subs.length > 0 && (
                                            <ul className={clsx("wg_navigationToc__sub")}>
                                                {section.subs.map((sub) => {
                                                    return (
                                                        <li className={clsx("wg_navigationToc__subItem")} key={sub.heading.slug}>
                                                            <a
                                                                className={clsx("wg_navigationToc__subLink", {
                                                                    "wg_navigationToc__subLink--active": sub.heading.slug === currentSlug,
                                                                })}
                                                                href={`#${sub.heading.slug}`}
                                                                data-toc-sub-link=""
                                                                aria-current={sub.heading.slug === currentSlug ? "location" : undefined}
                                                            >
                                                                {sub.heading.text}
                                                            </a>
                                                        </li>
                                                    );
                                                })}
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

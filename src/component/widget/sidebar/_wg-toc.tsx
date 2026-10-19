import clsx from "clsx";
import {useLayoutEffect, useState} from "hono/jsx";
import {anchor_shift_property} from "@/component/widget/article/_constant/anchor-shift";
import {reading_line_slack_px} from "@/component/widget/sidebar/_constant/reading-line";
import type {TocGroup} from "@/component/widget/sidebar/_type/toc-group";
import {copy_nav_toc_label} from "@/constant/copy";
import {scroll_user_input_events} from "@/constant/scroll";
import {findHashLink} from "@/util/dom/find-hash-link";
import {findHashTarget} from "@/util/dom/find-hash-target";
import {isRestoringNavigation} from "@/util/dom/is-restoring-navigation";
import {toHashId} from "@/util/dom/to-hash-id";
import "./_wg-toc.css";

/**
 * 현재 문서의 목차. 읽는 제목 한 항목만 강조
 */
export interface WgTocProps {
    /**
     * 본문 순서의 가름, 절, 소제목
     */
    groups: TocGroup[];
}

export const WgToc = (props: WgTocProps) => {
    const [currentSlug, setCurrentSlug] = useState<string>();

    /**
     * 연결마다 구독 설치, 초기 위치 갱신은 본문 파싱 이후 실행
     */
    useLayoutEffect(() => {
        const headings = props.groups.flatMap((group) => group.sections).flatMap((section) => [section.heading, ...section.subs.map((sub) => sub.heading)]);
        const frame = {id: 0};
        const lifetime = new AbortController();

        // 새로고침, 뒤로가기의 복원 위치에는 hash 제목 고정 미적용
        const lock = {slug: isRestoringNavigation() ? undefined : toHashId(location.hash)};

        /**
         * 연속 스크롤의 프레임당 1회 현재 제목 갱신
         *
         *   - 접힌 본문 제목은 제외하고 읽는 선을 통과한 마지막 제목 선택
         *   - 링크, hash로 이동한 제목은 사용자 스크롤 전까지 유지
         */
        const handleReadingPositionChange = () => {
            if (frame.id !== 0) {
                return;
            }

            frame.id = requestAnimationFrame(() => {
                frame.id = 0;

                const visible = headings.flatMap((heading) => {
                    const target = findHashTarget(`#${heading.slug}`);

                    return target?.checkVisibility()
                        ? [{slug: heading.slug, top: target.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(target).scrollMarginTop)}]
                        : [];
                });

                setCurrentSlug(
                    visible.find((heading) => heading.slug === lock.slug)?.slug ?? visible.findLast((heading) => heading.top <= reading_line_slack_px)?.slug ?? visible[0]?.slug,
                );
            });
        };

        /**
         * 문서 크기, 화면 높이 변경. 끝 구간 제목의 도착 위치를 목차 전환 위치와 맞춘 뒤 현재 제목 재계산
         *
         *   - 읽는 선에 닿지 못하는 끝 절이 있으면 마지막 한 화면 구간의 도착 위치를 문서 끝까지 비례 압축
         *   - 압축한 거리만큼 제목 위 여백 추가, 앵커 이동과 목차 판정이 같은 위치 사용
         */
        const handleLayoutChange = () => {
            for (const heading of headings) {
                findHashTarget(`#${heading.slug}`)?.style.removeProperty(anchor_shift_property);
            }

            const anchors = headings.flatMap((heading) => {
                const target = findHashTarget(`#${heading.slug}`);

                return target?.checkVisibility()
                    ? [{target, arrival: scrollY + target.getBoundingClientRect().top - Number.parseFloat(getComputedStyle(target).scrollMarginTop)}]
                    : [];
            });

            const last = anchors.at(-1);
            const scrollEnd = document.documentElement.scrollHeight - innerHeight;
            const isTailUnreachable = last !== undefined && scrollEnd > 0 && last.arrival > scrollEnd;

            if (isTailUnreachable) {
                const stretchFrom = Math.max(0, scrollEnd - innerHeight);
                const stretchScale = (scrollEnd - stretchFrom) / (last.arrival - stretchFrom);

                for (const anchor of anchors) {
                    if (anchor.arrival > stretchFrom) {
                        anchor.target.style.setProperty(anchor_shift_property, `${(anchor.arrival - stretchFrom) * (1 - stretchScale)}px`);
                    }
                }
            }

            handleReadingPositionChange();
        };

        /**
         * 같은 문서 hash 링크의 도착 제목 고정. 같은 hash 재클릭 포함
         */
        const handleHashLinkClick = (event: MouseEvent) => {
            const link = findHashLink(event);

            if (link === null) {
                return;
            }

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
         *
         *   - 재계산은 실제 스크롤에서 실행, 링크를 누르는 동안 다른 제목 표시 방지
         */
        const handleUserScroll = () => {
            lock.slug = undefined;
        };

        // 글꼴, 다이어그램, 접힘 변경의 문서 크기 변화 추적
        const observer = new ResizeObserver(handleLayoutChange);

        observer.observe(document.body);
        addEventListener("scroll", handleReadingPositionChange, {passive: true, signal: lifetime.signal});
        addEventListener("resize", handleLayoutChange, {signal: lifetime.signal});
        addEventListener("toggle", handleReadingPositionChange, {capture: true, signal: lifetime.signal});
        addEventListener("pageshow", handleReadingPositionChange, {signal: lifetime.signal});
        addEventListener("hashchange", handleHashChange, {signal: lifetime.signal});
        document.addEventListener("DOMContentLoaded", handleLayoutChange, {signal: lifetime.signal});
        document.addEventListener("click", handleHashLinkClick, {signal: lifetime.signal});

        for (const type of scroll_user_input_events) {
            addEventListener(type, handleUserScroll, {passive: true, signal: lifetime.signal});
        }

        if (document.readyState !== "loading") {
            handleLayoutChange();
        }

        return () => {
            cancelAnimationFrame(frame.id);
            lifetime.abort();
            observer.disconnect();

            for (const heading of headings) {
                findHashTarget(`#${heading.slug}`)?.style.removeProperty(anchor_shift_property);
            }
        };
    }, [props.groups]);

    return (
        <nav className={clsx("wg_toc__root")} aria-label={copy_nav_toc_label}>
            <div className={clsx("wg_toc__label")}>{copy_nav_toc_label}</div>

            {/**
             * 가름별 제목 이동. 하위 제목이 현재 위치여도 부모 글씨는 강조하지 않음
             */}
            {props.groups.map((group) => {
                return (
                    <div className={clsx("wg_toc__groupSection", {"wg_toc__groupSection--named": group.part !== undefined})} key={group.sections[0].heading.slug}>
                        {group.part !== undefined && <div className={clsx("wg_toc__group")}>{group.part}</div>}
                        <ul className={clsx("wg_toc__list")}>
                            {group.sections.map((section) => {
                                return (
                                    <li className={clsx("wg_toc__item")} key={section.heading.slug}>
                                        {/**
                                         * 절 제목. 읽는 위치면 현재 위치로 표시
                                         */}
                                        <a
                                            className={clsx("wg_toc__link", {"wg_toc__link--active": section.heading.slug === currentSlug})}
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
                                            <ul className={clsx("wg_toc__sub")}>
                                                {section.subs.map((sub) => {
                                                    return (
                                                        <li className={clsx("wg_toc__subItem")} key={sub.heading.slug}>
                                                            <a
                                                                className={clsx("wg_toc__subLink", {
                                                                    "wg_toc__subLink--active": sub.heading.slug === currentSlug,
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

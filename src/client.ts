/*
 * 브라우저 동작 · 커서 장식, 테마, 읽는 절, hash 위치 보정
 * 서버 HTML의 data-* 연결 · React hydration 없음
 */

import {heading_highlight_hold_ms} from "@/component/widget/prose/_constant/heading-highlight";
import {cursor_face_offset_px, cursor_face_storage_key} from "@/component/widget/shell/_constant/cursor-face";
import {reading_line_slack_px} from "@/component/widget/shell/_constant/reading-line";
import {findHashTarget} from "@/util/dom/find-hash-target";
import {revealHashTarget} from "@/util/dom/reveal-hash-target";

const cursorFace = document.querySelector<HTMLImageElement>("[data-cursor-face]");

if (cursorFace) {
    const cursorMedia = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const position = {x: 0, y: 0, frame: 0};

    /**
     * 터치 전환과 화면 이탈 시 예약된 이동도 취소해 장식이 다시 나타나지 않게 함
     */
    const handleCursorHide = () => {
        cancelAnimationFrame(position.frame);
        position.frame = 0;
        cursorFace.classList.remove("wg_shell__cursorFace--visible");
    };

    /**
     * 비활성 전환에서만 숨김 · 활성화 알림이 새 마우스 이동을 취소하지 않도록 함
     */
    const handleCursorMediaChange = () => {
        if (!cursorMedia.matches) {
            handleCursorHide();
        }
    };

    /**
     * 이동·화면 크기 변경·문서 진입에 같은 위치 계산 적용 · 화면 갱신마다 한 번만 반영
     */
    const renderCursorFace = () => {
        if (position.frame !== 0) {
            return;
        }

        position.frame = requestAnimationFrame(() => {
            position.frame = 0;

            // 포인터 좌표는 실행 중에만 결정 · transform으로 문서 재배치 방지
            cursorFace.style.transform = `translate3d(
                ${Math.max(0, Math.min(position.x + cursor_face_offset_px, document.documentElement.clientWidth - cursorFace.width - cursor_face_offset_px))}px,
                ${Math.max(0, Math.min(position.y + cursor_face_offset_px, document.documentElement.clientHeight - cursorFace.height - cursor_face_offset_px))}px,
                0
            )`;
            cursorFace.classList.add("wg_shell__cursorFace--visible");
        });
    };

    /**
     * 누른 상태도 마우스 입력으로 처리 · 클릭·텍스트 선택 중에도 얼굴 유지
     */
    const handleDocumentPointer = (event: PointerEvent) => {
        const isMouse = cursorMedia.matches && event.pointerType === "mouse";

        if (!isMouse) {
            handleCursorHide();

            return;
        }

        position.x = event.clientX;
        position.y = event.clientY;
        renderCursorFace();
    };

    /**
     * 이미 보이는 얼굴을 새 화면 크기에 맞춰 이동 · 추가 마우스 이동 불필요
     */
    const handleCursorResize = () => {
        if (cursorFace.classList.contains("wg_shell__cursorFace--visible")) {
            renderCursorFace();
        }
    };

    /**
     * 전체 페이지 이동에서도 마지막 좌표 유지 · 저장 실패는 기본 마우스 동작에 영향 없음
     */
    const handlePageHide = () => {
        if (!cursorFace.classList.contains("wg_shell__cursorFace--visible")) {
            return;
        }

        try {
            sessionStorage.setItem(cursor_face_storage_key, JSON.stringify({x: position.x, y: position.y}));
        } catch {
            // 저장소가 막힌 환경에서도 클릭·선택과 현재 페이지의 장식 유지
        }
    };

    /**
     * 첫 진입과 BFCache 복귀에서 좌표를 한 번 소비 · 이전 문서의 위치가 남지 않도록 삭제
     */
    const handlePageShow = () => {
        try {
            const stored = sessionStorage.getItem(cursor_face_storage_key);

            sessionStorage.removeItem(cursor_face_storage_key);

            if (stored !== null && cursorMedia.matches) {
                const point: unknown = JSON.parse(stored);
                // 속성 타입의 좁히기를 유지하도록 저장소 검증과 사용을 같은 분기에 둠
                if (
                    typeof point === "object" &&
                    point !== null &&
                    "x" in point &&
                    "y" in point &&
                    typeof point.x === "number" &&
                    typeof point.y === "number" &&
                    Number.isFinite(point.x) &&
                    Number.isFinite(point.y)
                ) {
                    position.x = point.x;
                    position.y = point.y;
                    renderCursorFace();
                }
            }
        } catch {
            // 저장 실패나 잘못된 좌표는 무시하고 다음 실제 마우스 입력에서 표시
        }
    };

    handlePageShow();

    document.addEventListener("pointermove", handleDocumentPointer, {passive: true});
    document.addEventListener("pointerdown", handleDocumentPointer, {passive: true});
    document.documentElement.addEventListener("pointerleave", handleCursorHide);
    addEventListener("blur", handleCursorHide);
    addEventListener("resize", handleCursorResize);
    addEventListener("pagehide", handlePageHide);
    addEventListener("pageshow", handlePageShow);
    cursorMedia.addEventListener("change", handleCursorMediaChange);
}

const hashTarget = revealHashTarget(location.hash);

// 값 조립이 아닌 현재 강조의 수명 상태 · 새 이동은 이전 타이머를 취소
let highlightedHeading: HTMLElement | null = null;
let highlightTimer = 0;
let highlightScroll: AbortController | null = null;

/**
 * 강조 해제와 도착 감시 정리 · 다음 앵커의 오래된 타이머 개입 방지
 */
const clearHeadingHighlight = () => {
    clearTimeout(highlightTimer);
    highlightScroll?.abort();
    highlightScroll = null;
    highlightedHeading?.classList.remove("wg_prose__headingText--highlighted");
    highlightedHeading = null;
};

/**
 * 도착한 제목만 잠시 강조 · 같은 대상 재클릭도 유지 시간 재시작
 */
const highlightHeading = (target: HTMLElement | null) => {
    clearHeadingHighlight();
    highlightedHeading = target === null ? null : target.querySelector<HTMLElement>(".wg_prose__headingText");

    if (highlightedHeading === null) {
        return;
    }

    highlightedHeading.classList.add("wg_prose__headingText--highlighted");
    highlightTimer = window.setTimeout(clearHeadingHighlight, heading_highlight_hold_ms);
    highlightScroll = new AbortController();

    // 부드러운 스크롤이 끝난 뒤에도 3초 확보 · 움직이지 않거나 scrollend가 없으면 위 타이머 사용
    document.addEventListener("scrollend", handleHighlightArrival, {signal: highlightScroll.signal});
};

/**
 * 본문 스크롤의 첫 도착에서 유지 시간 갱신 · 사이드바 스크롤은 제외
 */
const handleHighlightArrival = (event: Event) => {
    if (event.target !== document) {
        return;
    }

    clearTimeout(highlightTimer);
    highlightScroll?.abort();
    highlightScroll = null;
    highlightTimer = window.setTimeout(clearHeadingHighlight, heading_highlight_hold_ms);
};

/**
 * 같은 hash를 다시 눌러도 접힌 대상 공개 · 기본 링크 이동 유지
 */
const handleHashClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    if (
        event.currentTarget instanceof HTMLAnchorElement &&
        (event.currentTarget.target === "" || event.currentTarget.target === "_self") &&
        !event.currentTarget.hasAttribute("download") &&
        event.currentTarget.origin === location.origin &&
        event.currentTarget.pathname === location.pathname &&
        event.currentTarget.search === location.search &&
        event.currentTarget.hash
    ) {
        const target = revealHashTarget(event.currentTarget.hash);

        if (event.currentTarget.hash === location.hash) {
            highlightHeading(target);
        }
    }
};

/**
 * hash 변경의 숨은 대상 공개와 위치 보정
 */
const handleHashChange = () => {
    const target = revealHashTarget(location.hash);

    target?.scrollIntoView();
    highlightHeading(target);
};

for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    link.addEventListener("click", handleHashClick);
}

addEventListener("hashchange", handleHashChange);

// 목차 링크와 실제 제목 연결
const tocSections = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")].flatMap((link) => {
    const heading = findHashTarget(link.hash);
    const item = link.parentElement;

    if (!heading || !item) {
        return [];
    }

    return [
        {
            heading,
            link,
            subs: [...item.querySelectorAll<HTMLAnchorElement>("[data-toc-sub-link]")].flatMap((sub) => {
                const subHeading = findHashTarget(sub.hash);

                return subHeading ? [{heading: subHeading, link: sub}] : [];
            }),
        },
    ];
});
const firstSection = tocSections.at(0);

if (firstSection) {
    /**
     * 읽는 선 기준 절·소제목 표시
     * 기준: 제목의 scroll-margin-top + reading_line_slack_px
     */
    const markActive = () => {
        // scroll-margin-top 계산값: CSS px
        const line = Number.parseFloat(getComputedStyle(firstSection.heading).scrollMarginTop) + reading_line_slack_px;
        // 접힌 Details 안 제목은 좌표가 남아도 현재 위치에서 제외
        const current = tocSections.findLast((section) => section.heading.checkVisibility() && section.heading.getBoundingClientRect().top <= line) ?? firstSection;
        const sub = current.subs.findLast((item) => item.heading.checkVisibility() && item.heading.getBoundingClientRect().top <= line);

        for (const section of tocSections) {
            section.link.classList.toggle("wg_shellToc__link--active", section === current);

            for (const item of section.subs) {
                item.link.classList.toggle("wg_shellToc__subLink--active", item === sub);
            }
        }
    };

    addEventListener("scroll", markActive, {passive: true});
    addEventListener("resize", markActive);
    addEventListener("toggle", markActive, true);
    markActive();
}

const userScroll = new AbortController();

for (const type of ["wheel", "touchmove", "keydown", "mousedown"]) {
    addEventListener(type, () => userScroll.abort(), {once: true, passive: true});
}

/**
 * 글꼴 로드 후 hash 위치 보정 · 사용자 입력 시 자동 이동 취소
 * 초기 smooth scroll과 보정의 충돌 방지 · 보정 후 CSS 동작 복원
 */
const settleHashScroll = async () => {
    await document.fonts.ready;

    if (hashTarget && !userScroll.signal.aborted) {
        hashTarget.scrollIntoView({behavior: "instant"});
        highlightHeading(hashTarget);
    }

    document.documentElement.style.removeProperty("scroll-behavior");
};

// 글꼴 요청 완료 시점 보장 · load 후 fonts.ready
if (document.readyState === "complete") {
    settleHashScroll();
} else {
    addEventListener("load", settleHashScroll, {once: true});
}

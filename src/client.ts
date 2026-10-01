/*
 * 브라우저 동작 · 커서 장식, 테마, 읽는 절, hash 위치 보정
 * 서버 HTML의 data-* 연결 · React hydration 없음
 */

import {cursor_face_offset_px} from "@/component/widget/shell/_constant/cursor-face";
import {reading_line_slack_px} from "@/component/widget/shell/_constant/reading-line";
import {setThemeButton} from "@/component/widget/shell/_function/set-theme-button";
import {theme_mode, theme_order, theme_storage_key} from "@/constant/theme";
import {findHashTarget} from "@/util/dom/find-hash-target";
import {revealHashTarget} from "@/util/dom/reveal-hash-target";

const cursorFace = document.querySelector<HTMLImageElement>("[data-cursor-face]");

if (cursorFace) {
    const cursorMedia = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const position = {x: 0, y: 0, frame: 0};

    /**
     * 입력 전환과 화면 이탈 시 예약된 이동도 취소해 장식이 다시 나타나지 않게 함
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
     * 최신 마우스 위치를 화면 갱신마다 한 번만 반영 · 선택 중과 움직임 감소 설정에서는 숨김
     */
    const handleDocumentPointerMove = (event: PointerEvent) => {
        if (!cursorMedia.matches || event.pointerType !== "mouse" || event.buttons !== 0) {
            handleCursorHide();

            return;
        }

        position.x = event.clientX;
        position.y = event.clientY;

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

    document.addEventListener("pointermove", handleDocumentPointerMove, {passive: true});
    document.addEventListener("pointerdown", handleCursorHide, {passive: true});
    document.addEventListener("keydown", handleCursorHide);
    document.documentElement.addEventListener("pointerleave", handleCursorHide);
    addEventListener("blur", handleCursorHide);
    addEventListener("resize", handleCursorHide);
    cursorMedia.addEventListener("change", handleCursorMediaChange);
}

const themeButton = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");

/**
 * HTML 머리에서 적용한 테마 · 미지정 시 시스템
 */
const readThemeMode = () => {
    return theme_order.find((mode) => mode === document.documentElement.getAttribute("data-theme")) ?? theme_mode.system;
};

if (themeButton) {
    /**
     * 테마 순환과 저장 · 시스템 → 밝게 → 어둡게
     */
    const handleThemeClick = () => {
        const next = theme_order[(theme_order.indexOf(readThemeMode()) + 1) % theme_order.length];

        if (next === theme_mode.system) {
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute("data-theme", next);
        }

        setThemeButton(themeButton, next);

        try {
            localStorage.setItem(theme_storage_key, next);
        } catch {
            // 저장 실패 시 현재 방문의 테마 유지
        }
    };

    setThemeButton(themeButton, readThemeMode());
    themeButton.addEventListener("click", handleThemeClick);
}

const hashTarget = revealHashTarget(location.hash);

/**
 * 같은 hash를 다시 눌러도 접힌 대상 공개 · 기본 링크 이동 유지
 */
const handleHashClick: EventListener = (event) => {
    if (event.currentTarget instanceof HTMLAnchorElement) {
        revealHashTarget(event.currentTarget.hash);
    }
};

/**
 * hash 변경의 숨은 대상 공개와 위치 보정
 */
const handleHashChange = () => {
    revealHashTarget(location.hash)?.scrollIntoView();
};

for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
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
            list: item.querySelector("[data-toc-sub]"),
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
        const current = tocSections.findLast((section) => section.heading.getClientRects().length > 0 && section.heading.getBoundingClientRect().top <= line) ?? firstSection;
        const sub = current.subs.findLast((item) => item.heading.getClientRects().length > 0 && item.heading.getBoundingClientRect().top <= line);

        for (const section of tocSections) {
            section.link.classList.toggle("wg_shellNav__link--active", section === current);
            section.list?.classList.toggle("wg_shellNav__sub--open", section === current);

            for (const item of section.subs) {
                item.link.classList.toggle("wg_shellNav__subLink--active", item === sub);
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
    }

    document.documentElement.style.removeProperty("scroll-behavior");
};

// 글꼴 요청 완료 시점 보장 · load 후 fonts.ready
if (document.readyState === "complete") {
    settleHashScroll();
} else {
    addEventListener("load", settleHashScroll, {once: true});
}

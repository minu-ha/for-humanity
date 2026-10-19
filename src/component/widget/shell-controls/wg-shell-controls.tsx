import clsx from "clsx";
import {Fragment, useLayoutEffect, useRef} from "hono/jsx";
import {heading_highlight_hold_ms} from "@/component/widget/article/_constant/heading-highlight";
import {WgCursorFace} from "@/component/widget/cursor-face/wg-cursor-face";
import {WgMermaid} from "@/component/widget/mermaid/wg-mermaid";
import {WgSidebar, type WgSidebarProps} from "@/component/widget/sidebar/wg-sidebar";
import {scroll_user_input_events} from "@/constant/scroll";
import {findHashLink} from "@/util/dom/find-hash-link";
import {isRestoringNavigation} from "@/util/dom/is-restoring-navigation";
import {revealHashTarget} from "@/util/dom/reveal-hash-target";
import "./wg-shell-controls.css";

export const WgShellControls = (props: WgSidebarProps) => {
    const headingRef = useRef<HTMLElement | null>(null);
    const timerRef = useRef(0);
    const arrivalRef = useRef<AbortController | null>(null);
    const lifetimeRef = useRef<AbortController | null>(null);
    const userScrollRef = useRef<AbortController | null>(null);

    /**
     * 다음 앵커 이동과 해제에서 이전 강조, 도착 감시, 타이머를 함께 정리
     */
    const clearHeadingHighlight = () => {
        clearTimeout(timerRef.current);
        timerRef.current = 0;
        arrivalRef.current?.abort();
        arrivalRef.current = null;
        headingRef.current?.classList.remove("wg_article__headingText--highlighted");
        headingRef.current = null;
    };

    /**
     * 본문 스크롤 도착 후 3초 확보. 사이드바 자체의 scrollend는 제외
     */
    const handleHighlightArrival = (event: Event) => {
        if (event.target !== document) {
            return;
        }

        clearTimeout(timerRef.current);
        arrivalRef.current?.abort();
        arrivalRef.current = null;
        timerRef.current = window.setTimeout(clearHeadingHighlight, heading_highlight_hold_ms);
    };

    /**
     * 도착 제목만 강조. 같은 hash 재클릭도 유지 시간 재시작
     */
    const highlightHeading = (target: HTMLElement | null) => {
        clearHeadingHighlight();
        headingRef.current = target === null ? null : target.querySelector<HTMLElement>(".wg_article__headingText");

        if (headingRef.current === null) {
            return;
        }

        headingRef.current.classList.add("wg_article__headingText--highlighted");
        timerRef.current = window.setTimeout(clearHeadingHighlight, heading_highlight_hold_ms);
        arrivalRef.current = new AbortController();
        document.addEventListener("scrollend", handleHighlightArrival, {signal: arrivalRef.current.signal});
    };

    /**
     * 탐색 DOM이 다시 만들어져도 같은 hash의 접힌 Details 공개를 유지
     */
    const handleHashClick = (event: MouseEvent) => {
        const link = findHashLink(event);

        if (link === null) {
            return;
        }

        const target = revealHashTarget(link.hash);

        if (link.hash === location.hash) {
            highlightHeading(target);
        }
    };

    /**
     * hash 변경 시 접힌 대상을 공개하고 네이티브 스크롤, 강조 적용
     */
    const handleHashChange = () => {
        const target = revealHashTarget(location.hash);

        target?.scrollIntoView();
        highlightHeading(target);
    };

    /**
     * 첫 사용자 입력. 초기 앵커 보정 중단, 부드러운 절 이동 활성화
     */
    const handleUserScroll = () => {
        userScrollRef.current?.abort();
        document.documentElement.style.scrollBehavior = "smooth";
    };

    /**
     * 초기 폰트 로드 후 앵커 보정. 해제된 인스턴스와 사용자 이동에 개입하지 않음
     *
     *   - 새로고침, 뒤로가기는 브라우저의 이전 위치 복원 사용
     *   - 부드러운 절 이동은 보정 후 활성화, 복원 진입은 첫 사용자 입력까지 즉시 스크롤 유지
     */
    const handlePageLoad = async () => {
        const lifetime = lifetimeRef.current;
        const hash = location.hash;
        const target = revealHashTarget(hash);

        if (isRestoringNavigation()) {
            return;
        }

        await document.fonts.ready;

        if (lifetime === null || lifetime.signal.aborted) {
            return;
        }

        if (target !== null && !userScrollRef.current?.signal.aborted && hash === location.hash) {
            target.scrollIntoView({behavior: "instant"});
            highlightHeading(target);
        }

        document.documentElement.style.scrollBehavior = "smooth";
    };

    /**
     * 셸은 본문 앞에서 마운트. 본문 파싱 이후에만 초기 접힘 대상 조회
     */
    const handleBodyReady = () => {
        revealHashTarget(location.hash);

        if (document.readyState === "complete") {
            void handlePageLoad();
        }
    };

    /**
     * 본문 이벤트의 설치, 정리는 셸이 소유. SSR에서는 DOM에 접근하지 않음
     */
    useLayoutEffect(() => {
        const lifetime = new AbortController();

        lifetimeRef.current = lifetime;
        userScrollRef.current = new AbortController();
        document.addEventListener("click", handleHashClick, {signal: lifetime.signal});
        addEventListener("hashchange", handleHashChange, {signal: lifetime.signal});
        addEventListener("load", handlePageLoad, {once: true, signal: lifetime.signal});

        for (const type of scroll_user_input_events) {
            addEventListener(type, handleUserScroll, {once: true, passive: true, signal: lifetime.signal});
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", handleBodyReady, {once: true, signal: lifetime.signal});
        } else {
            handleBodyReady();
        }

        return () => {
            lifetime.abort();
            lifetimeRef.current = null;
            userScrollRef.current?.abort();
            userScrollRef.current = null;
            clearHeadingHighlight();
            document.documentElement.style.removeProperty("scroll-behavior");
        };
    }, []);

    return (
        <Fragment>
            {/**
             * 별도 DOM 경계로 탐색 갱신이 커서 형제 사이에서 dialog를 재삽입하지 않게 함
             */}
            <div className={clsx("wg_shellControls__sidebar")}>
                <WgSidebar data={props.data} stores={props.stores} />
            </div>
            {props.data.cursorFace && <WgCursorFace ready={props.stores !== undefined} />}
            <WgMermaid onRendered={handlePageLoad} />
        </Fragment>
    );
};

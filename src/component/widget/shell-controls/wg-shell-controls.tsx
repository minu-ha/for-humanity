import clsx from "clsx";
import {Fragment, useLayoutEffect, useRef} from "hono/jsx";
import {WgCursorFace} from "@/component/widget/cursor-face/wg-cursor-face";
import {WgMermaid} from "@/component/widget/mermaid/wg-mermaid";
import {heading_highlight_hold_ms} from "@/component/widget/shell-controls/_constant/heading-highlight";
import {WgSidebar, type WgSidebarProps} from "@/component/widget/sidebar/wg-sidebar";
import {scroll_user_input_events} from "@/constant/scroll";
import {findHashLink} from "@/util/dom/find-hash-link";
import {isRestoringNavigation} from "@/util/dom/is-restoring-navigation";
import {revealHashTarget} from "@/util/dom/reveal-hash-target";
import "./wg-shell-controls.css";

/**
 * 브라우저 셸 컨트롤 입력. 사이드바, 커서 장식, 다이어그램 연결, 제목 강조는 셸 소유
 */
export interface WgShellControlsProps {
    /**
     * 서버가 정리한 문서 목록, 현재 페이지 목차, 커서 장식 사용 여부
     */
    data: WgSidebarProps["data"];

    /**
     * 브라우저 진입점만 제공. 없으면 저장소와 전역 DOM 미사용, 커서 장식 미연결
     */
    stores?: WgSidebarProps["stores"];
}

export const WgShellControls = (props: WgShellControlsProps) => {
    const headingRef = useRef<HTMLElement | null>(null);
    const timerRef = useRef(0);
    const arrivalRef = useRef<AbortController | null>(null);
    const lifetimeRef = useRef<AbortController | null>(null);
    const userScrolledRef = useRef(false);

    /**
     * 다음 앵커 이동과 해제에서 이전 강조, 도착 감시, 타이머 함께 정리
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
     * 본문 스크롤 도착 후 강조 유지 시간 재시작
     *
     *   - 제약: document 구독은 본문 스크롤의 scrollend만 수신. 요소의 scrollend는 버블링 없음
     */
    const handleHighlightArrival = () => {
        clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(clearHeadingHighlight, heading_highlight_hold_ms);
    };

    /**
     * 도착 제목만 강조. 같은 해시 재클릭도 유지 시간 재시작
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
        document.addEventListener("scrollend", handleHighlightArrival, {once: true, signal: arrivalRef.current.signal});
    };

    /**
     * 탐색 DOM 재생성 후에도 같은 해시의 접힌 Details 공개 유지
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
     * 해시 변경 시 접힌 대상 공개, 네이티브 스크롤과 강조 적용
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
        userScrolledRef.current = true;
        document.documentElement.classList.add("wg_shell__document--smoothScroll");
    };

    /**
     * 초기 폰트 로드와 다이어그램 렌더 후 앵커 보정. 해제된 인스턴스와 사용자 이동에 개입하지 않음
     *
     *   - 새로고침, 뒤로가기는 브라우저의 이전 위치 복원 사용
     *   - 사용자 입력 이후의 렌더 완료는 접은 Details를 다시 열지 않음
     *   - 부드러운 절 이동은 보정 후 활성화, 복원 진입은 첫 사용자 입력까지 즉시 스크롤 유지
     */
    const handlePageLoad = async () => {
        if (isRestoringNavigation() || userScrolledRef.current) {
            return;
        }

        const lifetime = lifetimeRef.current;
        const hash = location.hash;
        const target = revealHashTarget(hash);

        await document.fonts.ready;

        if (lifetime === null || lifetime.signal.aborted) {
            return;
        }

        if (target !== null && !userScrolledRef.current && hash === location.hash) {
            target.scrollIntoView({behavior: "instant"});
            highlightHeading(target);
        }

        document.documentElement.classList.add("wg_shell__document--smoothScroll");
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
            clearHeadingHighlight();
            document.documentElement.classList.remove("wg_shell__document--smoothScroll");
        };
    }, []);

    return (
        <Fragment>
            {/**
             * 별도 DOM 경계, 탐색 갱신 시 커서 형제 사이의 dialog 재삽입 방지
             */}
            <div className={clsx("wg_shellControls__sidebar")}>
                <WgSidebar data={props.data} stores={props.stores} />
            </div>
            {props.data.cursorFace && <WgCursorFace ready={props.stores !== undefined} basePath={props.data.basePath} />}
            <WgMermaid onRendered={handlePageLoad} />
        </Fragment>
    );
};

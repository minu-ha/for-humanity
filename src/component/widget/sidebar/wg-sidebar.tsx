import clsx from "clsx";
import {type DOMAttributes, Fragment, useLayoutEffect, useRef, useState} from "hono/jsx";
import {flushSync} from "hono/jsx/dom";
import {navigation_mobile_query, navigation_wide_query} from "@/component/widget/sidebar/_constant/navigation";
import type {NavigationData} from "@/component/widget/sidebar/_type/navigation-data";
import type {NavigationFocusSnapshot} from "@/component/widget/sidebar/_type/navigation-focus-snapshot";
import {WgDocTree} from "@/component/widget/sidebar/_wg-doc-tree";
import {WgSidebarScroll} from "@/component/widget/sidebar/_wg-sidebar-scroll";
import {WgToc} from "@/component/widget/sidebar/_wg-toc";
import {copy_nav_close, copy_nav_open, copy_nav_title} from "@/constant/copy";
import type {createNavigationStores} from "@/store/navigation/create-navigation-stores";
import type {NavigationLayout} from "@/store/navigation/navigation-state";
import {revealHashTarget} from "@/util/dom/reveal-hash-target";
import "./wg-sidebar.css";

/**
 * 같은 Hono 탐색을 서버에서는 기본 링크로, 브라우저에서는 사용자 저장 상태로 렌더
 */
export interface WgSidebarProps {
    /**
     * 서버가 정리한 문서 목록과 현재 페이지 목차
     */
    data: NavigationData;

    /**
     * 브라우저 진입점만 제공. 없으면 저장소와 전역 DOM을 읽지 않음
     */
    stores?: ReturnType<typeof createNavigationStores>;
}

export const WgSidebar = (props: WgSidebarProps) => {
    const [layout, setLayout] = useState<NavigationLayout>(() => {
        if (props.stores === undefined) {
            return "desktop";
        }
        if (matchMedia(navigation_mobile_query).matches) {
            return "drawer";
        }
        return matchMedia(navigation_wide_query).matches ? "wide" : "desktop";
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigationRef = useRef<HTMLDivElement | null>(null);
    const documentsRef = useRef<HTMLDivElement | null>(null);
    const drawerNavigationRef = useRef<HTMLDivElement | null>(null);
    const drawerDocumentsRef = useRef<HTMLDivElement | null>(null);
    const outlineRef = useRef<HTMLDivElement | null>(null);
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const openButtonRef = useRef<HTMLButtonElement | null>(null);
    const brandRef = useRef<HTMLAnchorElement | null>(null);
    const mobileRef = useRef<MediaQueryList | null>(null);
    const wideRef = useRef<MediaQueryList | null>(null);
    const layoutRef = useRef(layout);
    const focusRef = useRef<NavigationFocusSnapshot | null>(null);
    const restorePendingRef = useRef(true);

    // 스크롤 이벤트마다 DOM 순회 없이 비교, 페이지별 활성 표시 제외
    const navigationSignature = JSON.stringify(props.data.groups, (key, value: unknown) => (key === "active" ? undefined : value));

    /**
     * 저장된 배치와 현재 CSS 조건을 구분. 조건 변경 직후 잘린 좌표를 이전 배치에 저장하지 않음
     */
    const getNavigationLayout = (): NavigationLayout => {
        if (mobileRef.current === null || wideRef.current === null) {
            return layoutRef.current;
        }
        if (mobileRef.current.matches) {
            return "drawer";
        }
        return wideRef.current.matches ? "wide" : "desktop";
    };

    /**
     * 배치별 DOM 참조 분리, 이전 노드 정리 시 새 배치 참조 유지
     */
    const getNavigationPort = () => {
        return layoutRef.current === "drawer" ? drawerNavigationRef.current : navigationRef.current;
    };

    /**
     * 배치별 DOM은 분리하되 좌표 저장과 복원은 현재 표시되는 한 영역을 소비
     */
    const getDocumentsPort = () => {
        return layoutRef.current === "drawer" ? drawerDocumentsRef.current : documentsRef.current;
    };

    /**
     * 닫기, 이동보다 먼저 실제 좌표 보존. 숨긴 모달과 아직 복원하지 않은 배치는 저장하지 않음
     */
    const saveScroll = () => {
        const documents = getDocumentsPort();
        const outline = outlineRef.current;
        if (
            props.stores === undefined ||
            documents === null ||
            outline === null ||
            restorePendingRef.current ||
            layoutRef.current !== getNavigationLayout() ||
            (layoutRef.current === "drawer" && dialogRef.current?.open !== true)
        ) {
            return;
        }
        props.stores.scroll.setState((state) => {
            return {
                positions: {
                    ...state.positions,
                    [layoutRef.current]: {
                        navigation: navigationSignature,
                        pathname: location.pathname,
                        documents: documents.scrollTop,
                        outline: outline.scrollTop,
                    },
                },
            };
        });
    };

    /**
     * 연결된 영역에서 첫 paint 전 복원. 문서는 페이지 간 공유하고 목차는 같은 경로에서만 재사용
     */
    const restoreScroll = () => {
        layoutRef.current = getNavigationLayout();
        const documents = getDocumentsPort();
        if (props.stores === undefined || documents === null || outlineRef.current === null) {
            return;
        }
        if (layoutRef.current === "drawer" && dialogRef.current?.open !== true) {
            return;
        }
        const position = props.stores.scroll.getState().positions[layoutRef.current];

        if (position?.navigation === navigationSignature) {
            documents.scrollTop = position.documents;
            outlineRef.current.scrollTop = position.pathname === location.pathname ? position.outline : 0;
        } else {
            documents.scrollTop = 0;
            outlineRef.current.scrollTop = 0;
        }

        restorePendingRef.current = false;
        saveScroll();

        // 첫 페인트의 넘침 표시 동기화, 비동기 scroll 이벤트 전 반영
        documents.dispatchEvent(new Event("scroll"));
        outlineRef.current.dispatchEvent(new Event("scroll"));
    };

    /**
     * 네이티브 close가 이전 열기 이벤트보다 늦게 도착해도 새 모달을 잠금 해제하지 않음
     */
    const handleDrawerClose = (_event: Event) => {
        if (dialogRef.current?.open === true) {
            return;
        }
        document.body.classList.remove("wg_shell__root--drawerOpen");
        setDrawerOpen(false);
    };

    /**
     * 네이티브 포커스 복원을 유지하면서 링크의 기본 이동보다 먼저 배경 잠금 해제
     */
    const closeNavigation = () => {
        saveScroll();
        dialogRef.current?.close();
        document.body.classList.remove("wg_shell__root--drawerOpen");
        setDrawerOpen(false);
    };

    /**
     * 모바일에서만 네이티브 모달을 열고 독립된 드로어 좌표를 즉시 복원
     */
    const handleOpenButtonClick: DOMAttributes["onClick"] = (_event) => {
        if (getNavigationLayout() !== "drawer" || dialogRef.current === null || dialogRef.current.open) {
            return;
        }
        dialogRef.current.showModal();
        document.body.classList.add("wg_shell__root--drawerOpen");
        setDrawerOpen(true);
        restoreScroll();
    };

    const handleCloseButtonClick: DOMAttributes["onClick"] = (_event) => {
        closeNavigation();
    };

    /**
     * Escape의 네이티브 포커스 복원을 쓰되 좌표는 닫힌 모달이 되기 전에 보존
     */
    const handleDrawerCancel = (event: Event) => {
        event.preventDefault();
        closeNavigation();
    };

    /**
     * 대화상자 내부 빈 공간은 유지하고 경계 밖 배경만 닫기
     */
    const handleDrawerClick: DOMAttributes["onClick"] = (event) => {
        if (dialogRef.current === null || event.target !== dialogRef.current) {
            return;
        }
        const bounds = dialogRef.current.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            closeNavigation();
        }
    };

    /**
     * 보조키, 새 탭 링크는 모달 유지. 기본 문서 이동만 닫고 같은 문서 제목에 키보드 위치 전달
     */
    const handleNavigationClick: DOMAttributes["onClick"] = (event) => {
        saveScroll();
        if (
            dialogRef.current?.open !== true ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            !(event.target instanceof Element)
        ) {
            return;
        }
        const link = event.target.closest("a[href]");
        if (!(link instanceof HTMLAnchorElement) || (link.target !== "" && link.target !== "_self") || link.hasAttribute("download")) {
            return;
        }
        closeNavigation();
        if (link.origin === location.origin && link.pathname === location.pathname && link.search === location.search && link.hash) {
            const target = revealHashTarget(link.hash);
            if (target !== null) {
                target.tabIndex = -1;
                target.focus({preventScroll: true});
            }
        }
    };

    /**
     * 같은 목록을 한 배치에만 렌더. 전환 전 포커스를 기억하고 새 배치가 연결된 뒤 좌표 복원
     */
    const handleLayoutChange = () => {
        const nextLayout = getNavigationLayout();
        if (nextLayout === layoutRef.current) {
            return;
        }
        if (document.activeElement instanceof HTMLElement) {
            focusRef.current = {
                navigation: document.activeElement.closest("[data-sidebar-docs]") !== null,
                drawer: document.activeElement === openButtonRef.current || document.activeElement.closest("[data-sidebar-drawer]") !== null,
                href: document.activeElement.getAttribute("href"),
            };
        }
        if (nextLayout !== "drawer") {
            closeNavigation();
        }
        restorePendingRef.current = true;
        layoutRef.current = nextLayout;
        flushSync(() => setLayout(nextLayout));
    };

    /**
     * BFCache 복귀 시 persist의 최신 저장 좌표를 다시 읽어 복원
     */
    const handlePageShow = (event: PageTransitionEvent) => {
        if (!event.persisted || props.stores === undefined) {
            return;
        }
        restorePendingRef.current = true;
        props.stores.scroll.persist.rehydrate();
        handleLayoutChange();
        restoreScroll();
    };

    /**
     * Hono 탐색이 전역 구독의 설치, 정리를 소유. 서버 렌더에서는 실행하지 않음
     */
    useLayoutEffect(() => {
        if (props.stores === undefined) {
            return;
        }
        mobileRef.current = matchMedia(navigation_mobile_query);
        wideRef.current = matchMedia(navigation_wide_query);
        mobileRef.current.addEventListener("change", handleLayoutChange);
        wideRef.current.addEventListener("change", handleLayoutChange);
        addEventListener("pagehide", saveScroll);
        addEventListener("pageshow", handlePageShow);
        return () => {
            mobileRef.current?.removeEventListener("change", handleLayoutChange);
            wideRef.current?.removeEventListener("change", handleLayoutChange);
            mobileRef.current = null;
            wideRef.current = null;
            removeEventListener("pagehide", saveScroll);
            removeEventListener("pageshow", handlePageShow);
            document.body.classList.remove("wg_shell__root--drawerOpen");
        };
    }, [props.stores]);

    /**
     * 최초 mount와 반응형 재연결의 paint 전 좌표, 포커스 복원. Hono의 fragment 연결 시점 보정
     */
    useLayoutEffect(() => {
        if (props.stores === undefined) {
            return;
        }
        let active = true;
        const restoreNavigation = () => {
            if (!active) {
                return;
            }
            restoreScroll();
            if (focusRef.current === null) {
                return;
            }
            const navigation = getNavigationPort();
            if (layout === "drawer") {
                if (focusRef.current.navigation) {
                    openButtonRef.current?.focus({preventScroll: true});
                }
            } else if (focusRef.current.navigation && navigation !== null) {
                const href = focusRef.current.href;
                const target = [...navigation.querySelectorAll<HTMLElement>("a[href]")].find((element) => element.getAttribute("href") === href);
                target?.focus({preventScroll: true});
            } else if (focusRef.current.drawer) {
                brandRef.current?.focus({preventScroll: true});
            }
            focusRef.current = null;
        };
        if (getDocumentsPort()?.isConnected) {
            restoreNavigation();
        } else {
            // Hono 최초 레이아웃 효과는 분리된 fragment에서 실행, DOM 연결 후 첫 페인트 전 보정
            queueMicrotask(restoreNavigation);
        }
        return () => {
            active = false;
        };
    }, [layout, props.stores]);

    return (
        <Fragment>
            {/**
             * 데스크톱 문서 사이드바. 모바일에서는 고정 브랜드와 연결된 메뉴 버튼
             */}
            <div className={clsx("wg_sidebar__docsColumn", props.stores !== undefined && "wg_sidebar__docsColumn--ready")}>
                {/**
                 * 어느 문서에서도 홈으로 이동. 모달 진입은 브라우저 동작이 연결된 뒤 표시
                 */}
                <div className={clsx("wg_sidebar__brandRow")}>
                    <a ref={props.stores === undefined ? undefined : brandRef} className={clsx("wg_sidebar__brand")} href="/" aria-current={props.data.home ? "page" : undefined}>
                        {props.data.title}
                    </a>

                    {/**
                     * 네이티브 모달의 열림 상태와 접근 가능한 진입 이름
                     */}
                    <button
                        ref={props.stores === undefined ? undefined : openButtonRef}
                        className={clsx("wg_sidebar__menuToggle", props.stores !== undefined && layout === "drawer" && "wg_sidebar__menuToggle--visible")}
                        type="button"
                        aria-label={copy_nav_open}
                        aria-controls="fh-navigation-drawer"
                        aria-expanded={String(drawerOpen)}
                        onClick={handleOpenButtonClick}
                    >
                        <svg className={clsx("wg_sidebar__menuIcon")} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/**
                 * JavaScript 없이도 전체 문서 링크를 표시. 브라우저 모바일에서는 드로어가 같은 목록을 소유
                 */}
                {layout !== "drawer" && (
                    <div ref={props.stores === undefined ? undefined : navigationRef} className={clsx("wg_sidebar__docsPanel")} data-sidebar-docs="" data-sidebar-layout={layout}>
                        <WgSidebarScroll portRef={documentsRef} kind="documents" ready={props.stores !== undefined} onScroll={saveScroll} onClick={handleNavigationClick}>
                            <WgDocTree groups={props.data.groups} />
                        </WgSidebarScroll>
                    </div>
                )}
            </div>

            {/**
             * 와이드 화면 전용 목차. 드로어에는 문서 목록만 표시
             */}
            <aside className={clsx("wg_sidebar__tocColumn")} data-sidebar-toc="">
                <div className={clsx("wg_sidebar__tocPanel")}>
                    <WgSidebarScroll portRef={outlineRef} kind="outline" ready={props.stores !== undefined} onScroll={saveScroll} onClick={handleNavigationClick}>
                        {props.data.outline.length > 0 && <WgToc groups={props.data.outline} />}
                    </WgSidebarScroll>
                </div>
            </aside>

            {/**
             * 브라우저 top layer의 포커스, Escape, 배경 클릭 동작과 모바일 문서 목록
             */}
            {/**
             * biome-ignore lint/a11y/useKeyWithClickEvents: 배경 클릭의 키보드 대안은 네이티브 dialog의 cancel과 닫기 버튼
             */}
            <dialog
                ref={props.stores === undefined ? undefined : dialogRef}
                className={clsx("wg_sidebar__drawer")}
                id="fh-navigation-drawer"
                aria-labelledby="fh-navigation-title"
                data-sidebar-drawer=""
                onClose={handleDrawerClose}
                onCancel={handleDrawerCancel}
                onClick={handleDrawerClick}
            >
                {/**
                 * 목록 스크롤과 독립된 대화상자 이름, 닫기 동작
                 */}
                <div className={clsx("wg_sidebar__drawerHeader")}>
                    <h2 className={clsx("wg_sidebar__drawerTitle")} id="fh-navigation-title">
                        {copy_nav_title}
                    </h2>

                    {/**
                     * 네이티브 close로 열기 버튼에 포커스 복원
                     */}
                    <button className={clsx("wg_sidebar__drawerClose")} type="button" aria-label={copy_nav_close} onClick={handleCloseButtonClick}>
                        <svg className={clsx("wg_sidebar__menuIcon")} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="m6 6 12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>

                {/**
                 * 모바일에만 한 번 렌더하는 문서 탐색. 다른 배치와 저장 좌표 분리
                 */}
                <div className={clsx("wg_sidebar__drawerContent")}>
                    {layout === "drawer" && (
                        <div
                            ref={props.stores === undefined ? undefined : drawerNavigationRef}
                            className={clsx("wg_sidebar__docsPanel")}
                            data-sidebar-docs=""
                            data-sidebar-layout={layout}
                        >
                            <WgSidebarScroll portRef={drawerDocumentsRef} kind="documents" ready={props.stores !== undefined} onScroll={saveScroll} onClick={handleNavigationClick}>
                                <WgDocTree groups={props.data.groups} />
                            </WgSidebarScroll>
                        </div>
                    )}
                </div>
            </dialog>
        </Fragment>
    );
};

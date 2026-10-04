import {navigation_mobile_query, navigation_wide_query} from "@/component/widget/shell/_constant/navigation";
import {restoreNavigationScroll} from "@/component/widget/shell/_function/restore-navigation-scroll";
import type {createNavigationStores} from "@/store/navigation/create-navigation-stores";
import type {NavigationLayout} from "@/store/navigation/navigation-state";
import {navigation_scroll_storage_key, navigation_storage_version} from "@/store/navigation/navigation-storage";
import {toNavigationScrollState} from "@/store/navigation/to-navigation-scroll-state";

/**
 * persist 스토어에 배치별 문서·목차 좌표 저장 · 첫 desktop 복원은 HTML이 완료하므로 재실행하지 않음
 */
export const bindNavigationScroll = (scroll: ReturnType<typeof createNavigationStores>["scroll"]) => {
    const navigation = document.querySelector<HTMLElement>("[data-navigation]");
    const documents = document.querySelector<HTMLElement>('[data-navigation-scroll="documents"]');
    const outline = document.querySelector<HTMLElement>('[data-navigation-scroll="outline"]');
    const dialog = document.querySelector<HTMLDialogElement>("[data-navigation-drawer]");
    const openButton = document.querySelector<HTMLButtonElement>("[data-navigation-open]");
    if (!navigation || !documents || !outline || !dialog || !openButton) return;

    const mobile = matchMedia(navigation_mobile_query);
    const wide = matchMedia(navigation_wide_query);
    /**
     * 스크롤 수명이 다른 세 배치 구분
     */
    const getLayout = (): NavigationLayout => {
        if (mobile.matches) return "drawer";
        return wide.matches ? "wide" : "desktop";
    };
    const layout = {current: getLayout()};
    const ports = [documents, outline];
    const signature = [...navigation.querySelectorAll<HTMLAnchorElement>(".wg_shellNav__root a[href]")].map((link) => `${link.pathname}:${link.textContent}`).join("\n");

    /**
     * 숨김·닫기보다 먼저 보존 · CSS 배치 전환으로 잘린 위치가 이전 배치를 덮지 않도록 함
     */
    const saveScroll = () => {
        if (layout.current !== getLayout() || (mobile.matches && !dialog.open)) return;
        scroll.setState((state) => ({
            positions: {
                ...state.positions,
                [layout.current]: {
                    navigation: signature,
                    pathname: location.pathname,
                    documents: documents.scrollTop,
                    outline: outline.scrollTop,
                },
            },
        }));
    };

    /**
     * 모달 열기·반응형 이동 후 위치 복원 · 이전 자료는 첫 사용에서 새 스토어 형태로 보존
     */
    const restoreScroll = () => {
        layout.current = getLayout();
        if (mobile.matches && !dialog.open) return;
        const position = scroll.getState().positions[layout.current];
        if (position === undefined) {
            documents.scrollTop = 0;
            outline.scrollTop = 0;
            restoreNavigationScroll({key: navigation_scroll_storage_key, version: navigation_storage_version, layout: layout.current, toState: toNavigationScrollState});
        } else {
            documents.scrollTop = position.navigation === signature ? position.documents : 0;
            outline.scrollTop = position.navigation === signature && position.pathname === location.pathname ? position.outline : 0;
        }
        navigation.dataset.navigationLayout = layout.current;
        saveScroll();
    };

    /**
     * BFCache의 이전 메모리 상태가 다음 문서에서 저장한 좌표를 덮지 않도록 새 자료부터 복원
     */
    const handlePageShow = (event: PageTransitionEvent) => {
        if (event.persisted) {
            scroll.persist.rehydrate();
            restoreScroll();
        }
    };

    for (const port of ports) {
        port.addEventListener("scroll", saveScroll, {passive: true});
        port.addEventListener("click", saveScroll, {capture: true});
    }
    dialog.addEventListener("cancel", saveScroll);
    dialog.querySelector("[data-navigation-close]")?.addEventListener("click", saveScroll, {capture: true});
    dialog.addEventListener("click", saveScroll, {capture: true});
    openButton.addEventListener("click", restoreScroll);
    mobile.addEventListener("change", restoreScroll);
    wide.addEventListener("change", restoreScroll);
    addEventListener("pagehide", saveScroll);
    addEventListener("pageshow", handlePageShow);
    // 첫 paint의 배치가 module 도착 전에 바뀐 경우에만 새 배치의 저장 좌표를 복원
    if (!mobile.matches && navigation.dataset.navigationLayout !== layout.current) {
        restoreScroll();
    } else {
        saveScroll();
    }
};
